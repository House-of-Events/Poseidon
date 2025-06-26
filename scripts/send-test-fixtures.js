import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { execSync } from 'child_process';
import config from '../config/index.js';

// Get secrets from Chamber for production
function getChamberSecrets(service) {
  const requiredKeys = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'sqs_fixtures_daily_queue_url'
  ];
  
  const secrets = {};
  
  requiredKeys.forEach(key => {
    try {
      const value = execSync(`chamber read ${service} ${key} -q`).toString().trim();
      secrets[key] = value;
    } catch (error) {
      console.error(`Error reading ${key} from ${service}:`, error.message);
      process.exit(1);
    }
  });
  
  return secrets;
}

// Create SQS client based on environment
function createSQSClient() {
  const isLocal = process.env.NODE_ENV === 'local';
  
  if (isLocal) {
    return new SQSClient({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
  } else {
    const awsSecrets = getChamberSecrets('app-aws');
    return new SQSClient({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: awsSecrets.AWS_ACCESS_KEY_ID,
        secretAccessKey: awsSecrets.AWS_SECRET_ACCESS_KEY,
      }
    });
  }
}

// Get queue URL based on environment
function getQueueUrl() {
  const isLocal = process.env.NODE_ENV === 'local';
  
  if (isLocal) {
    return 'http://localhost:4566/000000000000/fixtures-daily-queue';
  } else {
    const awsSecrets = getChamberSecrets('app-aws');
    return awsSecrets.sqs_fixtures_daily_queue_url;
  }
}

// Sample fixture data
const testFixtures = [
  {
    fixture_id: 'mat_791647',
    match_id: 'soccer:2025-06-26:Fla:Bay',
    date_time_of_match: '2024-06-26T15:00:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 150,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'slack',
    notification_status: 'pending'
  },
  {
    fixture_id: 'mat_791648',
    match_id: 'soccer:2025-06-27:Fla:Bay',
    date_time_of_match: '2024-06-27T16:30:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 200,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'email',
    notification_status: 'pending'
  },
  {
    fixture_id: 'mat_791649',
    match_id: 'soccer:2025-06-28:Fla:Bay',
    date_time_of_match: '2024-06-28T20:00:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 75,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'slack',
    notification_status: 'pending'
  }
];

async function sendTestFixtures() {
  const isLocal = process.env.NODE_ENV === 'local';
  const queueUrl = getQueueUrl();
  const sqsClient = createSQSClient();
  
  console.log(`Sending test fixtures to ${isLocal ? 'local' : 'production'} queue:`, queueUrl);
  
  for (const fixture of testFixtures) {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(fixture),
      MessageAttributes: {
        'MessageType': {
          DataType: 'String',
          StringValue: 'FIXTURE'
        }
      }
    };

    try {
      const command = new SendMessageCommand(params);
      const response = await sqsClient.send(command);
      console.log(`Sent fixture ${fixture.fixture_id}:`, response.MessageId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

// Run the script
sendTestFixtures()
  .then(() => console.log('Finished sending test fixtures'))
  .catch(console.error); 