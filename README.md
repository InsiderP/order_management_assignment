# Order Processing System

A scalable, event-driven Order Processing System built with Node.js, Express, MongoDB, Redis, and AWS services.

## Features

- User Authentication with JWT & Refresh Tokens
- Order Management
- Inventory Check
- Asynchronous Order Processing with AWS SQS
- Caching with Redis
- Email Notifications with AWS SES

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- AWS Account with SQS and SES services configured
- AWS CLI configured with appropriate credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/order_processing

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SQS_QUEUE_URL=your_sqs_queue_url
AWS_SES_FROM_EMAIL=your_verified_ses_email
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd order-processing-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Application

1. Start the main application:
```bash
npm run dev
```

2. Start the order processor worker in a separate terminal:
```bash
npm run worker
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic and external services
├── utils/          # Utility functions
├── workers/        # Background workers
└── app.js          # Main application file
```

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC 