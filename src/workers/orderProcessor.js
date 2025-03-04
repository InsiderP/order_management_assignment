require('dotenv').config();
const AWS = require('aws-sdk');
const Order = require('../models/order.model');
const redisService = require('../services/redis.service');
const awsService = require('../services/aws.service');

class OrderProcessor {
  constructor() {
    this.sqs = new AWS.SQS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
  }

  async start() {
    console.log('Starting order processor...');
    this.pollQueue();
  }

  async pollQueue() {
    try {
      const params = {
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
      };

      const data = await this.sqs.receiveMessage(params).promise();
      
      if (data.Messages) {
        for (const message of data.Messages) {
          await this.processMessage(message);
        }
      }

      // Continue polling
      this.pollQueue();
    } catch (error) {
      console.error('Error polling queue:', error);
      // Retry after delay
      setTimeout(() => this.pollQueue(), 5000);
    }
  }

  async processMessage(message) {
    try {
      const orderData = JSON.parse(message.Body);
      const order = await Order.findById(orderData.orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status to processing
      order.status = 'processing';
      await order.save();

      // Simulate order processing (replace with actual business logic)
      await this.simulateOrderProcessing(order);

      // Update order status to processed
      order.status = 'processed';
      order.paymentStatus = 'completed';
      await order.save();

      // Update Redis cache
      await redisService.setOrder(order._id.toString(), order);

      // Send confirmation email
      await awsService.sendOrderConfirmation(order, orderData.userEmail);

      // Delete message from queue
      await this.sqs.deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle
      }).promise();

      console.log(`Order ${order._id} processed successfully`);
    } catch (error) {
      console.error(`Error processing order ${orderData.orderId}:`, error);
      
      // Update order status to failed
      const order = await Order.findById(orderData.orderId);
      if (order) {
        order.status = 'failed';
        order.errorMessage = error.message;
        await order.save();
      }

      // Delete message from queue
      await this.sqs.deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle
      }).promise();
    }
  }

  async simulateOrderProcessing(order) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Start the order processor
const processor = new OrderProcessor();
processor.start().catch(console.error); 