const Redis = require('redis');

class RedisService {
  constructor() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('Connected to Redis'));
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async setOrder(orderId, orderData, expirationTime = 600) {
    try {
      await this.client.set(
        `order:${orderId}`,
        JSON.stringify(orderData),
        { EX: expirationTime }
      );
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async getOrder(orderId) {
    try {
      const orderData = await this.client.get(`order:${orderId}`);
      return orderData ? JSON.parse(orderData) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async deleteOrder(orderId) {
    try {
      await this.client.del(`order:${orderId}`);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }
}

module.exports = new RedisService(); 