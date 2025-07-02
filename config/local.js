export default {
    // Database Configuration - using local Docker setup
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5429, // Docker compose port
    DB_NAME: process.env.DB_NAME || 'poseidon-docker',
    DB_USER: process.env.DB_USER || 'admin',
    DB_PASSWORD: process.env.DB_PASSWORD || 'admin',
    
    // SQS Configuration - for local testing, you can use a mock or localstack
    SQS_FIXTURES_DAILY_QUEUE_URL: process.env.SQS_FIXTURES_DAILY_QUEUE_URL || 'http://localhost:4566/000000000000/fixtures-daily-queue',
    
    // AWS Configuration for local testing
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'test',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    
    // SSL Configuration
    SHADOW_DB_SSL: process.env.SHADOW_DB_SSL === 'true' || false,

    ZEUS_API_URL: process.env.ZEUS_API_URL || 'http://localhost:3002/v1',
    ZEUS_ADMIN_USERNAME: process.env.ZEUS_ADMIN_USERNAME || 'admin',
    ZEUS_ADMIN_PASSWORD: process.env.ZEUS_ADMIN_PASSWORD || '',
}; 