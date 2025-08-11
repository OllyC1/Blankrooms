const jwt = require('jsonwebtoken');
const { getDb } = require('../_lib/mongo');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Parse body properly for Vercel
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    
    const { token } = body;
    
    if (!token) {
      return res.status(401).json({ error: 'Token is required' });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const decoded = jwt.verify(token, jwtSecret);
    
    const db = await getDb();
    
    // Find user by ID from token
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Return user data
    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.error('[verify] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};