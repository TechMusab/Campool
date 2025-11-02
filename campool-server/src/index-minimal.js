require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Add error handling for missing environment variables
if (!process.env.MONGO_URI) {
	console.warn('WARNING: MONGO_URI environment variable is not set');
}

if (!process.env.JWT_SECRET) {
	console.warn('WARNING: JWT_SECRET environment variable is not set');
}

// Middleware
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGO_URI = process.env.MONGO_URI;

async function connectDB(maxAttempts = 4) {
    let attempt = 0;
    let lastError;
    while (attempt < maxAttempts && mongoose.connection.readyState === 0) {
        try {
            if (attempt > 0) {
                const delayMs = 500 * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, delayMs));
            }
            console.log(`Attempting to connect to MongoDB (attempt ${attempt + 1}/${maxAttempts})...`);
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 45000,
                maxPoolSize: 1,
                heartbeatFrequencyMS: 10000,
            });
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            lastError = error;
            console.error('❌ MongoDB connection error:', error?.message || error);
        }
        attempt++;
    }
    if (mongoose.connection.readyState === 0 && lastError) {
        console.error('❌ Failed to connect to MongoDB after retries:', {
            message: lastError.message,
            code: lastError.code,
            name: lastError.name
        });
    }
    return mongoose.connection.readyState === 1;
}

// Helper function
function safeMount(path, getRouter) {
    try {
        console.log(`🔧 Attempting to mount routes at ${path}...`);
        const router = getRouter();
        app.use(path, router);
        console.log(`✅ Mounted routes at ${path}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to mount routes at ${path}:`, error.message);
        console.error(`Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return false;
    }
}

// MINIMAL VERSION: Only mount auth routes
console.log('🚀 Starting minimal server with AUTH routes only...');
console.log(`📦 Node version: ${process.version}`);
console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const mounted = [];
console.log('🔄 Loading auth routes...');
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
console.log('🔄 Loading ride routes...');
mounted.push(safeMount('/api', () => require('./routes/rideRoutes')));

if (mounted.some(Boolean)) {
    console.log(`✅ ${mounted.filter(Boolean).length} route sets mounted successfully`);
} else {
    console.error('❌ Failed to mount routes');
}

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'Campool API Server (Minimal Mode)', 
		status: 'running',
		endpoints: {
			auth: [
				'POST /api/auth/request-otp',
				'POST /api/auth/verify-otp',
				'POST /api/auth/signup',
				'POST /api/auth/login'
			],
			rides: [
				'GET /rides/search',
				'POST /rides/create',
				'GET /rides/:id'
			]
		},
		timestamp: new Date().toISOString()
	});
});

// Add a simple test endpoint that doesn't require DB
app.get('/test', (req, res) => {
	res.json({ 
		message: 'Server is running', 
		timestamp: new Date().toISOString(),
		env: process.env.NODE_ENV || 'development'
	});
});

// Diagnostic endpoint
app.get('/diagnostic', (req, res) => {
	const diagnostic = {
		status: 'ok',
		mode: 'minimal',
		timestamp: new Date().toISOString(),
		environment: {
			NODE_ENV: process.env.NODE_ENV || 'development',
			hasMongoUri: !!process.env.MONGO_URI,
			hasJwtSecret: !!process.env.JWT_SECRET,
			hasCorsOrigin: !!process.env.CORS_ORIGIN
		},
		mongodb: {
			connectionState: mongoose.connection.readyState,
			connectionStates: {
				0: 'disconnected',
				1: 'connected',
				2: 'connecting',
				3: 'disconnecting'
			}
		},
		endpoints: {
			health: '/health',
			test: '/test',
			diagnostic: '/diagnostic',
			auth: '/api/auth/*'
		}
	};
	
	res.json(diagnostic);
});

// Initialize database connection (fire-and-forget for Vercel)
// This starts the connection but doesn't block the app export
connectDB().catch(err => {
	console.error('Initial DB connection failed:', err);
});

// Ensure DB connection on auth requests (best-effort)
app.use(['/api/auth', '/api/auth/*'], async (req, res, next) => {
    if (mongoose.connection.readyState === 0) {
        await connectDB(3);
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(500).json({ 
		error: 'Internal Server Error',
		message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
	});
});

// 404 handler - use proper catch-all route
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

console.log('✅ Minimal server configured with auth and ride endpoints');
console.log('📋 Available endpoints:');
console.log('   Auth:');
console.log('   - POST /api/auth/request-otp');
console.log('   - POST /api/auth/verify-otp');
console.log('   - POST /api/auth/signup');
console.log('   - POST /api/auth/login');
console.log('   Rides:');
console.log('   - GET /rides/search');
console.log('   - POST /rides/create');
console.log('   - GET /rides/:id');
console.log('   Diagnostics:');
console.log('   - GET /health');
console.log('   - GET /diagnostic');

// Export for Vercel
module.exports = app;

