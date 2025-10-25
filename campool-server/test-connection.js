const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://joiya4636_db_user:DpaUlj32dANb6hNR@cluster0.jwgufdj.mongodb.net/campool?retryWrites=true&w=majority';

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string:', MONGO_URI.substring(0, 50) + '...');
    
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB connected successfully!');
        console.log('Connection state:', mongoose.connection.readyState);
        
        // Test a simple operation
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ 
            test: 'connection', 
            timestamp: new Date(),
            message: 'Database connection successful!'
        });
        console.log('✅ Database write test successful!');
        
        await mongoose.disconnect();
        console.log('✅ Connection closed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Name:', error.name);
        
        if (error.message.includes('authentication')) {
            console.log('💡 Authentication issue. Check username/password.');
        } else if (error.message.includes('network') || error.message.includes('whitelist')) {
            console.log('💡 Network issue. Check IP whitelist in MongoDB Atlas.');
        } else if (error.message.includes('timeout')) {
            console.log('💡 Timeout issue. Check if cluster is running.');
        }
    }
}

testConnection();
