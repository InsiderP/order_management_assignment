require('dotenv').config();
const mongoose = require('mongoose');
const seedDatabase = require('../utils/seedData');

const seed = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Run seed data
    console.log('Starting to seed database...');
    await seedDatabase();

    // Verify data was created
    const User = require('../models/user.model');
    const Order = require('../models/order.model');
    
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log('\nVerification:');
    console.log(`Total Users in DB: ${userCount}`);
    console.log(`Total Orders in DB: ${orderCount}`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during seeding:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

seed(); 