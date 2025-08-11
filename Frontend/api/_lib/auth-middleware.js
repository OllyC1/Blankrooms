const jwt = require('jsonwebtoken');
const { getDb } = require('./mongo');
const { ObjectId } = require('mongodb');

async function requireAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const decoded = jwt.verify(token, jwtSecret);
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    return null;
  }
}

function requireRole(requiredRole) {
  return async (req, res, next) => {
    const user = await requireAuth(req, res);
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (user.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    req.user = user;
    if (next) next();
    return user;
  };
}

module.exports = { requireAuth, requireRole };