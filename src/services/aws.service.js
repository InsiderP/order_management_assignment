const AWS = require('aws-sdk');

class AWSService {
  constructor() {
    this.sqs = new AWS.SQS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    this.ses = new AWS.SES({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async sendToQueue(orderData) {
    try {
      const params = {
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        MessageBody: JSON.stringify(orderData)
      };

      const result = await this.sqs.sendMessage(params).promise();
      return result.MessageId;
    } catch (error) {
      console.error('SQS send error:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const params = {
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
              Data: body
            }
          }
        }
      };

      const result = await this.ses.sendEmail(params).promise();
      return result.MessageId;
    } catch (error) {
      console.error('SES send error:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(order, userEmail) {
    const subject = `Order Confirmation - ${order._id}`;
    const body = `
      <h1>Order Confirmation</h1>
      <p>Dear Customer,</p>
      <p>Your order has been successfully processed.</p>
      <h2>Order Details:</h2>
      <p>Order ID: ${order._id}</p>
      <p>Status: ${order.status}</p>
      <p>Total Amount: $${order.totalAmount}</p>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `
          <li>${item.name} - Quantity: ${item.quantity} - Price: $${item.price}</li>
        `).join('')}
      </ul>
      <p>Thank you for your business!</p>
    `;

    return this.sendEmail(userEmail, subject, body);
  }
}

module.exports = new AWSService(); 