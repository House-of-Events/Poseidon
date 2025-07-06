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

    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'dev-fixtures-daily-details-bucket',
    S3_REGION: process.env.S3_REGION || 'us-east-1',
    S3_ENDPOINT: process.env.S3_ENDPOINT || 'http://localhost:4566',
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === 'true' || false,

    // Email Configuration for local testing
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER || 'houseofevents.tracker@gmail.com',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || 'insufsiapcixanjd',
    SMTP_FROM: process.env.SMTP_FROM || 'houseofevents.tracker@gmail.com',
    TEST_EMAIL: process.env.TEST_EMAIL || 'manan78424@gmail.com',
}; 