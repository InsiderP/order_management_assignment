const { SQSClient, SendMessageCommand, DeleteMessageCommand, ReceiveMessageCommand } = require('@aws-sdk/client-sqs');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const winston = require('winston');

// Configure logger
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

class QueueService {
  constructor() {
    const config = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    };

    this.queue = new SQSClient(config);
    this.mailer = new SESClient(config);
    this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
  }

  async addToQueue(data) {
    try {
      const msg = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(data),
        MessageAttributes: {
          'Type': {
            DataType: 'String',
            StringValue: 'NewOrder'
          }
        }
      });

      const response = await this.queue.send(msg);
      log.info(`Added to queue: ${response.MessageId}`);
      return response.MessageId;
    } catch (err) {
      log.error('Queue error:', err);
      throw new Error(`Failed to add to queue: ${err.message}`);
    }
  }

  async sendMail(to, subject, content) {
    try {
      const msg = new SendEmailCommand({
        Source: process.env.AWS_SES_FROM_EMAIL,
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: {
            Data: subject
          },
          Body: {
            Html: {
              Data: content
            }
          }
        }
      });

      const response = await this.mailer.send(msg);
      log.info(`Mail sent: ${response.MessageId}`);
      return response.MessageId;
    } catch (err) {
      log.error('Mail error:', err);
      throw new Error(`Failed to send mail: ${err.message}`);
    }
  }

  async sendOrderMail(order, email) {
    const subject = `Order #${order._id} - Confirmation`;
    const content = this.getOrderMailContent(order);
    return this.sendMail(email, subject, content);
  }

  getOrderMailContent(order) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Hi there,</p>
        <p>Your order is ready!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <h2 style="color: #444;">Order Info:</h2>
          <p><strong>Order #:</strong> ${order._id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
          
          <h3 style="color: #555;">Your Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items.map(item => `
              <li style="margin-bottom: 10px; padding: 10px; background-color: white; border-radius: 3px;">
                ${item.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <p style="margin-top: 20px;">Thanks for shopping with us!</p>
      </div>
    `;
  }

  async getMessages() {
    try {
      const msg = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        AttributeNames: ['All'],
        MessageAttributeNames: ['All']
      });

      const response = await this.queue.send(msg);
      return response.Messages || [];
    } catch (err) {
      log.error('Queue read error:', err);
      throw new Error(`Failed to read queue: ${err.message}`);
    }
  }

  async removeMessage(receipt) {
    try {
      const msg = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receipt
      });

      await this.queue.send(msg);
      log.info('Message removed from queue');
    } catch (err) {
      log.error('Queue delete error:', err);
      throw new Error(`Failed to remove message: ${err.message}`);
    }
  }
}

module.exports = new QueueService(); 