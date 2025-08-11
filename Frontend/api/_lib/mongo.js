// MongoDB connection helper for Vercel Serverless Functions (CommonJS)
const { MongoClient } = require('mongodb');

let cached = global.__blankrooms_mongo;
if (!cached) {
  cached = global.__blankrooms_mongo = { client: null, db: null };
}

async function getDb() {
  if (cached.db) return cached.db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it in Vercel → Project → Settings → Environment Variables.');
  }

  const client = cached.client || new MongoClient(uri, { maxPoolSize: 5 });
  if (!cached.client) {
    await client.connect();
    cached.client = client;
  }
  const dbName = process.env.MONGODB_DB || 'Blankrooms';
  const db = client.db(dbName);
  cached.db = db;
  return db;
}

module.exports = { getDb };

