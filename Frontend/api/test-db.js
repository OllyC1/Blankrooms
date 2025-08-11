const { getDb } = require('./_lib/mongo');

module.exports = async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Check environment variables
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const db = await getDb();
    console.log('Database connected successfully');
    
    // Test a simple operation
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      collections: collections.map(c => c.name),
      env: {
        mongoUriExists: !!process.env.MONGODB_URI,
        jwtSecretExists: !!process.env.JWT_SECRET
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};