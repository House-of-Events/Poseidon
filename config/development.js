import { execSync } from 'child_process';

// Get secrets from Chamber
// In config/development.js
function getChamberSecrets(service) {
    const requiredKeys = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY', 
      'sqs_fixtures_daily_queue_url',
      'db_host',
      'db_port',
      'db_name',
      'db_username',
      'db_password',
      's3_bucket_name',
      's3_region',
      's3_endpoint',
      's3_force_path_style',
      'zeus_api_url',
      'zeus_admin_username',
      'zeus_admin_password',
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_password',
      'smtp_from'
    ];

    const temporaryKeys = [
      's3_bucket_name',
      's3_region',
      's3_endpoint',
      's3_force_path_style',
      'zeus_api_url',
      'zeus_admin_username',
      'zeus_admin_password',
      'smtp_host',
      'smtp_port',
    ];
    const secrets = {};
    
    requiredKeys.forEach(key => {
      try {
        const value = execSync(`chamber read ${service} ${key} -q`).toString().trim();
        secrets[key] = value;
      } catch (error) {
        if (temporaryKeys.includes(key)) {
          // Warn if the key is not set in Chamber but is temporary
          console.warn(`Warning: ${key} is not set in Chamber for ${service}`);
        } else {
          console.error(`Error reading ${key} from ${service}:`, error.message);
          process.exit(1);
        }
      }
    });
    return secrets;
  }

const appSecrets = getChamberSecrets('app-aws');
export default {
    // Database Configuration
    DB_HOST: appSecrets.db_host || 'localhost',
    DB_PORT: appSecrets.db_port || 5432,
    DB_NAME: appSecrets.db_name || 'fixtures_daily',
    DB_USER: appSecrets.db_username || 'postgres',
    DB_PASSWORD: appSecrets.db_password || 'postgres',
    SQS_FIXTURES_DAILY_QUEUE_URL: appSecrets.sqs_fixtures_daily_queue_url,
    
    // AWS Configuration - with fallback to environment variables
    AWS_ACCESS_KEY_ID: appSecrets.aws_access_key_id || process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: appSecrets.aws_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: 'us-west-2',
    
    // SSL Configuration
    SHADOW_DB_SSL: process.env.SHADOW_DB_SSL === 'true' || false,

    // S3 Configuration
    S3_BUCKET_NAME: appSecrets.s3_bucket_name || 'dev-fixtures-daily-details-bucket',
    S3_REGION: appSecrets.s3_region || 'us-east-1',
    S3_ENDPOINT: appSecrets.s3_endpoint || 'http://localhost:4566',
    S3_FORCE_PATH_STYLE: appSecrets.s3_force_path_style === 'true' || false,

    // Zeus Configuration
    ZEUS_API_URL: appSecrets.zeus_api_url || 'http://localhost:3002/v1',
    ZEUS_ADMIN_USERNAME: appSecrets.zeus_admin_username || 'admin',
    ZEUS_ADMIN_PASSWORD: appSecrets.zeus_admin_password || '',

    // Email Configuration
    SMTP_HOST: appSecrets.smtp_host || 'smtp.gmail.com',
    SMTP_PORT: appSecrets.smtp_port || 587,
    SMTP_USER: appSecrets.smtp_user,
    SMTP_PASSWORD: appSecrets.smtp_password,
    SMTP_FROM: appSecrets.smtp_from,
};
