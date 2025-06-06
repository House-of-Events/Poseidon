import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { execSync } from 'child_process';
import config from '../config/index.js';

// Get secrets from Chamber
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

const awsSecrets = getChamberSecrets('app-aws');

const sqsClient = new SQSClient({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: awsSecrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsSecrets.AWS_SECRET_ACCESS_KEY,
  }
});

// Sample fixture data
const testFixtures = [
  {
    id: 'fixture-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    date: '2024-06-15T15:00:00Z',
    competition: 'Premier League'
  },
  {
    id: 'fixture-2',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    date: '2024-06-16T16:30:00Z',
    competition: 'Premier League'
  },
  {
    id: 'fixture-3',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    date: '2024-06-17T20:00:00Z',
    competition: 'La Liga'
  }
];

async function sendTestFixtures() {
  console.log('Sending test fixtures to queue:', awsSecrets.sqs_fixtures_daily_queue_url);
  
  for (const fixture of testFixtures) {
    const params = {
      QueueUrl: awsSecrets.sqs_fixtures_daily_queue_url,
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
      console.log(`Sent fixture ${fixture.id}:`, response.MessageId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

// Run the script
sendTestFixtures()
  .then(() => console.log('Finished sending test fixtures'))
  .catch(console.error); 