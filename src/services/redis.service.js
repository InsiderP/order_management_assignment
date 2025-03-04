const Redis = require('redis');
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

class CacheService {
  constructor() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });

    this.client.on('error', (err) => log.error('Redis error:', err));
    this.client.on('connect', () => log.info('Connected to Redis'));
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async setOrder(orderId, orderData, ttl = 600) {
    try {
      await this.client.set(
        `order:${orderId}`,
        JSON.stringify(orderData),
        { EX: ttl }
      );
      return true;
    } catch (err) {
      log.error('Redis set error:', err);
      return false;
    }
  }

  async getOrder(orderId) {
    try {
      const data = await this.client.get(`order:${orderId}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      log.error('Redis get error:', err);
      return null;
    }
  }

  async removeOrder(orderId) {
    try {
      await this.client.del(`order:${orderId}`);
      return true;
    } catch (err) {
      log.error('Redis delete error:', err);
      return false;
    }
  }
}

module.exports = new CacheService(); 