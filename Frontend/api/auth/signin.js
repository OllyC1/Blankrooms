const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../_lib/mongo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email, password, rememberMe } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    
    // Find user by email
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const expiresIn = rememberMe ? '30d' : '7d';
    
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn }
    );
    
    // Return success with token and redirect URL
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      redirectUrl: user.role === 'admin' ? '/admin-dashboard.html' : '/user-dashboard.html',
      rememberMe: !!rememberMe
    });
    
  } catch (error) {
    console.error('[signin] error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};