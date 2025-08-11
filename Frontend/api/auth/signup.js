const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../_lib/mongo');

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
    
    const { name, email, password } = body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user', // Default role
      emailVerified: false,
      createdAt: new Date(),
      lastLogin: null,
      preferences: {
        emailNotifications: true,
        smsNotifications: false
      }
    };
    
    const { insertedId } = await db.collection('users').insertOne(newUser);
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
    const token = jwt.sign(
      { 
        userId: insertedId.toString(),
        email: newUser.email,
        role: newUser.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Return success with token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      redirectUrl: newUser.role === 'admin' ? '/admin-dashboard.html' : '/user-dashboard.html'
    });
    
  } catch (error) {
    console.error('[signup] error:', error);
    console.error('[signup] error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};