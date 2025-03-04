require('dotenv').config();
const Order = require('../models/order.model');
const redisService = require('../services/redis.service');
const queueService = require('../services/aws.service');
const winston = require('winston');


const log = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class OrderHandler {
  constructor() {
    this.running = false;
    this.waitTime = 5000;
  }

  async start() {
    if (this.running) {
      log.warn('Already running');
      return;
    }

    this.running = true;
    log.info('Starting order handler');
    await this.checkQueue();
  }

  async stop() {
    this.running = false;
    log.info('Stopping order handler');
  }

  async checkQueue() {
    while (this.running) {
      try {
        const messages = await queueService.getMessages();
        
        if (messages.length > 0) {
          log.info(`Found ${messages.length} orders to process`);
          await this.handleOrders(messages);
        }
      } catch (err) {
        log.error('Queue check failed:', err);
        await this.handleError(err);
      }
    }
  }

  async handleOrders(messages) {
    for (const msg of messages) {
      try {
        await this.handleOrder(msg);
      } catch (err) {
        log.error(`Failed to process order ${msg.MessageId}:`, err);
        await this.handleError(err);
      }
    }
  }

  async handleOrder(msg) {
    const data = JSON.parse(msg.Body);
    log.info(`Processing order: ${data.orderId}`);

    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    order.status = 'processing';
    await order.save();
    log.info(`Order ${order._id} is now processing`);

    await this.processOrder(order);

    order.status = 'processed';
    order.paymentStatus = 'completed';
    await order.save();
    log.info(`Order ${order._id} is now processed`);

    await redisService.setOrder(order._id.toString(), order);
    log.info(`Order ${order._id} cached`);

    await queueService.sendOrderMail(order, data.userEmail);
    log.info(`Sent confirmation for order ${order._id}`);

    await queueService.removeMessage(msg.ReceiptHandle);
    log.info(`Removed message ${msg.MessageId}`);

    log.info(`Order ${order._id} done`);
  }

  async processOrder(order) {
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async handleError(err) {
    log.error('Error:', err);
    if (this.running) {
      log.info(`Retrying in ${this.waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, this.waitTime));
    }
  }
}


const handler = new OrderHandler();


process.on('SIGTERM', async () => {
  log.info('Shutting down...');
  await handler.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('Shutting down...');
  await handler.stop();
  process.exit(0);
});

handler.start().catch(err => {
  log.error('Fatal error:', err);
  process.exit(1);
}); 