import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { execSync } from 'child_process';
import config from '../config/index.js';

// Get secrets from Chamber
function getChamberSecrets(service) {
  try {
    const output = execSync(`chamber read ${service} --format json`).toString();
    return JSON.parse(output);
  } catch (error) {
    console.error(`Error reading Chamber secrets for ${service}:`, error);
    process.exit(1);
  }
}

const awsSecrets = getChamberSecrets('app-aws');
const fixturesSecrets = getChamberSecrets('fixtures-daily');

const sqsClient = new SQSClient({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: awsSecrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsSecrets.AWS_SECRET_ACCESS_KEY,
    sessionToken: awsSecrets.AWS_SESSION_TOKEN
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
  console.log('Sending test fixtures to queue:', fixturesSecrets.sqs_fixtures_daily_queue_url);
  
  for (const fixture of testFixtures) {
    const params = {
      QueueUrl: fixturesSecrets.sqs_fixtures_daily_queue_url,
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