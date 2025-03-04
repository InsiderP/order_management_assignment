const Order = require('../models/order.model');
const redisService = require('../services/redis.service');
const awsService = require('../services/aws.service');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user._id;

    // Create new order
    const order = new Order({
      userId,
      items,
      shippingAddress,
      status: 'pending'
    });

    await order.save();

    // Send order to SQS for processing
    await awsService.sendToQueue({
      orderId: order._id,
      userId,
      items,
      shippingAddress
    });

    // Cache order in Redis
    await redisService.setOrder(order._id.toString(), order);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
};

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Try to get order from Redis cache first
    let order = await redisService.getOrder(id);

    // If not in cache, get from database
    if (!order) {
      order = await Order.findOne({ _id: id, userId });
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Cache the order in Redis
      await redisService.setOrder(id, order);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrder
}; 