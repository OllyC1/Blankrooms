const bcrypt = require('bcryptjs');
const { getDb } = require('./_lib/mongo');

module.exports = async (req, res) => {
  try {
    console.log('Setting up demo users...');
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Check if users already exist
    const existingAdmin = await usersCollection.findOne({ email: 'admin@demo.com' });
    const existingUser = await usersCollection.findOne({ email: 'user@demo.com' });
    
    const results = [];
    
    // Create Admin User
    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('admin123', 12);
      const adminUser = {
        name: 'Admin Demo',
        email: 'admin@demo.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: null,
        preferences: {
          emailNotifications: true,
          smsNotifications: false
        }
      };
      
      const adminResult = await usersCollection.insertOne(adminUser);
      results.push({
        type: 'admin',
        email: 'admin@demo.com',
        password: 'admin123',
        id: adminResult.insertedId.toString(),
        status: 'created'
      });
      console.log('Created admin user:', adminResult.insertedId);
    } else {
      results.push({
        type: 'admin',
        email: 'admin@demo.com',
        password: 'admin123',
        id: existingAdmin._id.toString(),
        status: 'already exists'
      });
    }
    
    // Create Regular User
    if (!existingUser) {
      const userPasswordHash = await bcrypt.hash('password123', 12);
      const regularUser = {
        name: 'User Demo',
        email: 'user@demo.com',
        passwordHash: userPasswordHash,
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: null,
        preferences: {
          emailNotifications: true,
          smsNotifications: false
        }
      };
      
      const userResult = await usersCollection.insertOne(regularUser);
      results.push({
        type: 'user',
        email: 'user@demo.com',
        password: 'password123',
        id: userResult.insertedId.toString(),
        status: 'created'
      });
      console.log('Created regular user:', userResult.insertedId);
    } else {
      results.push({
        type: 'user',
        email: 'user@demo.com',
        password: 'password123',
        id: existingUser._id.toString(),
        status: 'already exists'
      });
    }
    
    // Count total users
    const totalUsers = await usersCollection.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'Demo users setup completed',
      users: results,
      totalUsersInDatabase: totalUsers,
      loginUrls: {
        admin: 'https://blankrooms.vercel.app/signin.html',
        user: 'https://blankrooms.vercel.app/signin.html'
      }
    });
    
  } catch (error) {
    console.error('Setup demo users error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};