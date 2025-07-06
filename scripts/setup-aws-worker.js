import { SQSClient, CreateQueueCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

// Configure AWS clients for LocalStack
const awsConfig = {
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    forcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    }
};

const sqsClient = new SQSClient(awsConfig);
const s3Client = new S3Client(awsConfig);

async function setupSQS() {
    try {
        console.log('Setting up local SQS queue...');
        
        const createQueueCommand = new CreateQueueCommand({
            QueueName: 'fixtures-daily-queue',
            Attributes: {
                VisibilityTimeout: '30',
                MessageRetentionPeriod: '1209600', // 14 days
                ReceiveMessageWaitTimeSeconds: '20' // Long polling
            }
        });
        
        const result = await sqsClient.send(createQueueCommand);
        console.log(`SQS queue created successfully: ${result.QueueUrl}`);
        
        return result.QueueUrl;
    } catch (error) {
        if (error.name === 'QueueNameExists') {
            console.log('ℹ️  SQS queue already exists');
            return 'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/fixtures-daily-queue';
        } else {
            console.error('Error creating SQS queue:', error);
            throw error;
        }
    }
}

async function setupS3() {
    try {
        console.log('Setting up local S3 bucket...');
        
        const bucketName = 'dev-fixtures-daily-details-bucket';
        
        // Create bucket
        const createBucketCommand = new CreateBucketCommand({
            Bucket: bucketName
        });
        
        await s3Client.send(createBucketCommand);
        console.log(`S3 bucket '${bucketName}' created successfully in LocalStack`);
        
        // Set CORS policy
        const corsCommand = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                        AllowedOrigins: ['*'],
                        ExposeHeaders: []
                    }
                ]
            }
        });
        
        await s3Client.send(corsCommand);
        console.log(`CORS policy set for bucket '${bucketName}'`);
        
    } catch (error) {
        if (error.name === 'BucketAlreadyExists') {
            console.log(`S3 bucket 'dev-fixtures-daily-details-bucket' already exists in LocalStack`);
        } else {
            console.error('Error setting up LocalStack S3:', error);
            throw error;
        }
    }
}

async function sendTestMessage(queueUrl) {
    try {
        console.log('Sending test message to SQS...');
        
        const testFixture = {
            id: 'test_fixture_001',
            fixture_id: 'test_fixture_001',
            match_id: 'test_match_001',
            date_time: '2025-07-02T10:00:00Z',
            fixture_type: 'soccer',
            count_users_to_inform: 0,
            count_users_successfully_notified: 0,
            count_users_failed_to_notify: 0,
            notification_type: 'slack',
            notification_status: 'pending',
            fixture_data: {
                "date": "2025-06-15",
                "time": "16:00:00",
                "venue": "TQL Stadium",
                "league": "FIFA Club World Cup",
                "periods": {
                  "first": 1750003200,
                  "second": 1750006800
                },
                "referee": "Issa Sy",
                "timezone": "UTC",
                "away_team": "Auckland City",
                "date_time": "2025-06-15T16:00:00.000Z",
                "home_team": "Bayern München",
                "timestamp": 1750003200,
                "sport_type": "soccer",
                "teams_details": {
                  "away": {
                    "id": 2537,
                    "logo": "https://media.api-sports.io/football/teams/2537.png",
                    "name": "Auckland City",
                    "winner": false
                  },
                  "home": {
                    "id": 157,
                    "logo": "https://media.api-sports.io/football/teams/157.png",
                    "name": "Bayern München",
                    "winner": true
                  }
                },
                "venue_details": {
                  "id": 19229,
                  "city": "Cincinnati, Ohio",
                  "name": "TQL Stadium"
                },
                "api_fixture_id": "1321681",
                "league_details": {
                  "id": 15,
                  "flag": null,
                  "logo": "https://media.api-sports.io/football/leagues/15.png",
                  "name": "FIFA Club World Cup",
                  "round": "Group Stage - 1",
                  "season": 2025,
                  "country": "World",
                  "standings": true
                },
                "status_details": {
                  "long": "Match Finished",
                  "extra": 6,
                  "short": "FT",
                  "elapsed": 90
                }
              }
        };
        
        const sendMessageCommand = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(testFixture)
        });
        
        await sqsClient.send(sendMessageCommand);
        console.log('Test message sent successfully');
        console.log('Test fixture data:', JSON.stringify(testFixture, null, 2));
        
    } catch (error) {
        console.error('Error sending test message:', error);
        throw error;
    }
}

async function setupAWSWorker() {
    try {
        console.log('Setting up AWS Worker environment...\n');
        
        // Setup SQS
        const queueUrl = await setupSQS();
        console.log('');
        
        // Setup S3
        await setupS3();
        console.log('');
        
        // Send test message
        await sendTestMessage(queueUrl);
        console.log('');
        
        console.log('AWS Worker setup complete!');
        console.log('Resources created:');
        console.log('   • SQS Queue: fixtures-daily-queue');
        console.log('   • S3 Bucket: dev-fixtures-daily-details-bucket');
        console.log('   • Test message sent to queue');
        console.log('\nYou can now run: npm run start:local');
        
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setupAWSWorker(); 