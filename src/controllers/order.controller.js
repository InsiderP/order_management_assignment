const Order = require('../models/order.model');
const redisService = require('../services/redis.service');
const awsService = require('../services/aws.service');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user._id;

   
    const order = new Order({
      userId,
      items,
      shippingAddress,
      status: 'pending'
    });

    await order.save();

   
    await awsService.sendToQueue({
      orderId: order._id,
      userId,
      items,
      shippingAddress
    });

  
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

    
    let order = await redisService.getOrder(id);


    if (!order) {
      order = await Order.findOne({ _id: id, userId });
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

    
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