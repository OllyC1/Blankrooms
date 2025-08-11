// MongoDB connection helper for Vercel Serverless Functions (CommonJS)
const { MongoClient } = require('mongodb');

let cached = global.__blankrooms_mongo;
if (!cached) {
  cached = global.__blankrooms_mongo = { client: null, db: null };
}

async function getDb() {
  if (cached.db) return cached.db;

  try {
    const uri = process.env.MONGODB_URI;
    console.log('Environment check:');
    console.log('- MONGODB_URI exists:', !!uri);
    console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    if (!uri) {
      throw new Error('MONGODB_URI is not set. Add it in Vercel → Project → Settings → Environment Variables.');
    }

    // Check URI format
    if (!uri.startsWith('mongodb')) {
      throw new Error('Invalid MONGODB_URI format. Should start with mongodb:// or mongodb+srv://');
    }

    console.log('Connecting to MongoDB...');
    const client = cached.client || new MongoClient(uri, { 
      maxPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    });
    
    if (!cached.client) {
      await client.connect();
      // Test connection
      await client.db('admin').command({ ping: 1 });
      console.log('MongoDB connected successfully');
      cached.client = client;
    }
    
    const dbName = process.env.MONGODB_DB || 'Blankrooms';
    console.log('Using database:', dbName);
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    const db = client.db(dbName);
    cached.db = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

module.exports = { getDb };

