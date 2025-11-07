require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const app = express();

// Add error handling for missing environment variables
if (!MONGO_URI) {
    console.warn('WARNING: Neither MONGO_URI nor MONGODB_URI environment variables are set');
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
async function connectDB(maxAttempts = 4) {
    let attempt = 0;
    let lastError;
    while (attempt < maxAttempts && mongoose.connection.readyState === 0) {
        try {
            if (attempt > 0) {
                const delayMs = 500 * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, delayMs));
            }
            if (!MONGO_URI) {
                throw new Error('MongoDB connection string is not configured');
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

// Routes - load each independently so one failure doesn't break all
function safeMount(path, getRouter) {
    try {
        const router = getRouter();
        app.use(path, router);
        console.log(`Mounted routes at ${path}`);
        return true;
    } catch (error) {
        console.error(`Failed to mount routes at ${path}:`, error.message);
        return false;
    }
}

const mounted = [];
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
mounted.push(safeMount('/api', () => require('./routes/rideRoutes')));
mounted.push(safeMount('/api', () => require('./routes/ratingRoutes')));
mounted.push(safeMount('/api', () => require('./routes/statsRoutes')));
mounted.push(safeMount('/api/dashboard', () => require('./routes/dashboardRoutes')));
mounted.push(safeMount('/api/users', () => require('./routes/userRoutes')));

// Mount chat last; if it fails, other routes still work
mounted.push(safeMount('/api', () => require('./routes/chat')));

if (mounted.some(Boolean)) {
    console.log('Routes mounted (some may have been skipped)');
} else {
    console.error('No routes mounted successfully');
}

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ 
		message: 'Campool API Server', 
		status: 'running',
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
		timestamp: new Date().toISOString(),
		environment: {
			NODE_ENV: process.env.NODE_ENV || 'development',
			hasMongoUri: !!MONGO_URI,
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

// Export for Vercel
module.exports = app;