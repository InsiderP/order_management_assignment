const User = require('../models/user.model');
const Order = require('../models/order.model');
const bcrypt = require('bcryptjs');

const seedUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  }
];

const seedOrders = [
  {
    items: [
      {
        productId: 'P001',
        name: 'Laptop',
        quantity: 1,
        price: 999.99
      },
      {
        productId: 'P002',
        name: 'Mouse',
        quantity: 2,
        price: 29.99
      }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    status: 'processed',
    paymentStatus: 'completed'
  },
  {
    items: [
      {
        productId: 'P003',
        name: 'Headphones',
        quantity: 1,
        price: 79.99
      }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA'
    },
    status: 'processing',
    paymentStatus: 'pending'
  },
  {
    items: [
      {
        productId: 'P004',
        name: 'Keyboard',
        quantity: 1,
        price: 89.99
      },
      {
        productId: 'P005',
        name: 'Monitor',
        quantity: 1,
        price: 299.99
      }
    ],
    shippingAddress: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    status: 'pending',
    paymentStatus: 'pending'
  }
];

const calculateTotalAmount = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

const seedDatabase = async () => {
  try {
    console.log('Clearing existing data...');
    // Clear existing data
    const userDeleteResult = await User.deleteMany({});
    const orderDeleteResult = await Order.deleteMany({});
    console.log(`Cleared ${userDeleteResult.deletedCount} users and ${orderDeleteResult.deletedCount} orders`);

    console.log('\nCreating users...');
    // Create users
    const createdUsers = await Promise.all(
      seedUsers.map(async (user) => {
        try {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          const newUser = await User.create({
            ...user,
            password: hashedPassword
          });
          console.log(`Created user: ${newUser.name}`);
          return newUser;
        } catch (error) {
          console.error(`Error creating user ${user.email}:`, error.message);
          throw error;
        }
      })
    );

    console.log('\nCreating orders...');
    // Create orders
    const createdOrders = await Promise.all(
      seedOrders.map(async (order, index) => {
        try {
          // Calculate total amount before creating order
          const totalAmount = calculateTotalAmount(order.items);
          
          const newOrder = await Order.create({
            ...order,
            userId: createdUsers[index % createdUsers.length]._id,
            totalAmount // Add the calculated total amount
          });
          console.log(`Created order: ${newOrder._id} with total amount: $${totalAmount}`);
          return newOrder;
        } catch (error) {
          console.error(`Error creating order:`, error.message);
          throw error;
        }
      })
    );

    // Verify the created data
    const finalUserCount = await User.countDocuments();
    const finalOrderCount = await Order.countDocuments();

    console.log('\nFinal Database State:');
    console.log(`Users in database: ${finalUserCount}`);
    console.log(`Orders in database: ${finalOrderCount}`);

    if (finalUserCount !== seedUsers.length || finalOrderCount !== seedOrders.length) {
      throw new Error('Data verification failed: incorrect number of records created');
    }

  } catch (error) {
    console.error('Error in seedDatabase:', error);
    throw error;
  }
};

module.exports = seedDatabase; 