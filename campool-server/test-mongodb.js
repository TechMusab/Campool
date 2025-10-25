const mongoose = require('mongoose');

// Test MongoDB connection
async function testConnection() {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
        console.log('❌ MONGO_URI environment variable not set');
        return;
    }
    
    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string format:', MONGO_URI.substring(0, 20) + '...');
    
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB connected successfully!');
        console.log('Connection state:', mongoose.connection.readyState);
        
        // Test a simple operation
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
        console.log('✅ Database write test successful!');
        
        await mongoose.disconnect();
        console.log('✅ Connection closed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Name:', error.name);
        
        if (error.message.includes('authentication')) {
            console.log('💡 This looks like an authentication issue. Check your username/password.');
        } else if (error.message.includes('network')) {
            console.log('💡 This looks like a network issue. Check your network access settings.');
        } else if (error.message.includes('timeout')) {
            console.log('💡 This looks like a timeout issue. Check if your cluster is running.');
        }
    }
}

testConnection();
