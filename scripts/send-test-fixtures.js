import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { execSync } from 'child_process';
import config from '../config/index.js';
import logger from '../lib/logger.js';
// Get secrets from Chamber for production
function getChamberSecrets(service) {
  const requiredKeys = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'sqs_fixtures_daily_queue_url',
  ];

  const secrets = {};

  requiredKeys.forEach(key => {
    try {
      const value = execSync(`chamber read ${service} ${key} -q`)
        .toString()
        .trim();
      secrets[key] = value;
    } catch (error) {
      logger.error(`Error reading ${key} from ${service}:`, error.message);
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
        secretAccessKey: 'test',
      },
    });
  } else {
    const awsSecrets = getChamberSecrets('app-aws');
    return new SQSClient({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: awsSecrets.AWS_ACCESS_KEY_ID,
        secretAccessKey: awsSecrets.AWS_SECRET_ACCESS_KEY,
      },
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
    id: 'mat_791647',
    match_id: 'soccer:2025-06-26:Fla:Bay',
    date_time: '2024-06-26T15:00:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 150,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'slack',
    notification_status: 'pending',
    fixture_data: {
      date: '2025-06-15',
      time: '16:00:00',
      venue: 'TQL Stadium',
      league: 'FIFA Club World Cup',
      periods: {
        first: 1750003200,
        second: 1750006800,
      },
      referee: 'Issa Sy',
      timezone: 'UTC',
      away_team: 'Chelsea FC',
      date_time: '2025-06-15T16:00:00.000Z',
      home_team: 'Bayern München',
      timestamp: 1750003200,
      sport_type: 'soccer',
      teams_details: {
        away: {
          id: 2537,
          logo: 'https://media.api-sports.io/football/teams/2537.png',
          name: 'Chelsea FC',
          winner: false,
        },
        home: {
          id: 157,
          logo: 'https://media.api-sports.io/football/teams/157.png',
          name: 'Bayern München',
          winner: true,
        },
      },
      venue_details: {
        id: 19229,
        city: 'Cincinnati, Ohio',
        name: 'TQL Stadium',
      },
      api_fixture_id: '1321681',
      league_details: {
        id: 15,
        flag: null,
        logo: 'https://media.api-sports.io/football/leagues/15.png',
        name: 'FIFA Club World Cup',
        round: 'Group Stage - 1',
        season: 2025,
        country: 'World',
        standings: true,
      },
      status_details: {
        long: 'Match Finished',
        extra: 6,
        short: 'FT',
        elapsed: 90,
      },
    },
  },
  {
    id: 'mat_791648',
    match_id: 'soccer:2025-06-27:Fla:Bay',
    date_time: '2024-06-27T16:30:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 200,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'email',
    notification_status: 'pending',
    fixture_data: {
      date: '2025-06-15',
      time: '16:00:00',
      venue: 'TQL Stadium',
      league: 'FIFA Club World Cup',
      periods: {
        first: 1750003200,
        second: 1750006800,
      },
      referee: 'Issa Sy',
      timezone: 'UTC',
      away_team: 'Liverpool FC',
      date_time: '2025-06-15T16:00:00.000Z',
      home_team: 'Manchester United FC',
      timestamp: 1750003200,
      sport_type: 'soccer',
      teams_details: {
        away: {
          id: 2537,
          logo: 'https://media.api-sports.io/football/teams/2537.png',
          name: 'Liverpool FC',
          winner: false,
        },
        home: {
          id: 157,
          logo: 'https://media.api-sports.io/football/teams/157.png',
          name: 'Manchester United FC',
          winner: true,
        },
      },
      venue_details: {
        id: 19229,
        city: 'Manchester, England',
        name: 'Old Trafford',
      },
      api_fixture_id: '1321681',
      league_details: {
        id: 15,
        flag: null,
        logo: 'https://media.api-sports.io/football/leagues/15.png',
        name: 'FIFA Club World Cup',
        round: 'Group Stage - 1',
        season: 2025,
        country: 'World',
        standings: true,
      },
      status_details: {
        long: 'Match Finished',
        extra: 6,
        short: 'FT',
        elapsed: 90,
      },
    },
  },
  {
    id: 'mat_791649',
    match_id: 'soccer:2025-06-28:Fla:Bay',
    date_time: '2024-06-28T20:00:00Z',
    fixture_type: 'soccer',
    count_users_to_inform: 75,
    count_users_successfully_notified: 0,
    count_users_failed_to_notify: 0,
    notification_type: 'slack',
    notification_status: 'pending',
    fixture_data: {
      date: '2025-06-15',
      time: '16:00:00',
      venue: 'TQL Stadium',
      league: 'FIFA Club World Cup',
      periods: {
        first: 1750003200,
        second: 1750006800,
      },
      referee: 'Issa Sy',
      timezone: 'UTC',
      away_team: 'Everton FC',
      date_time: '2025-06-15T16:00:00.000Z',
      home_team: 'Manchester City FC',
      timestamp: 1750003200,
      sport_type: 'soccer',
      teams_details: {
        away: {
          id: 2537,
          logo: 'https://media.api-sports.io/football/teams/2537.png',
          name: 'Everton FC',
          winner: false,
        },
        home: {
          id: 157,
          logo: 'https://media.api-sports.io/football/teams/157.png',
          name: 'Manchester City FC',
          winner: true,
        },
      },
      venue_details: {
        id: 19229,
        city: 'Manchester, England',
        name: 'Old Trafford',
      },
      api_fixture_id: '1321681',
      league_details: {
        id: 15,
        flag: null,
        logo: 'https://media.api-sports.io/football/leagues/15.png',
        name: 'FIFA Club World Cup',
        round: 'Group Stage - 1',
        season: 2025,
        country: 'World',
        standings: true,
      },
      status_details: {
        long: 'Match Finished',
        extra: 6,
        short: 'FT',
        elapsed: 90,
      },
    },
  },
];

async function sendTestFixtures() {
  const isLocal = process.env.NODE_ENV === 'local';
  const queueUrl = getQueueUrl();
  const sqsClient = createSQSClient();

  logger.info(
    `Sending test fixtures to ${isLocal ? 'local' : 'production'} queue:`,
    queueUrl
  );

  for (const fixture of testFixtures) {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(fixture),
      MessageAttributes: {
        MessageType: {
          DataType: 'String',
          StringValue: 'FIXTURE',
        },
      },
    };

    try {
      const command = new SendMessageCommand(params);
      const response = await sqsClient.send(command);
      logger.info(`Sent fixture ${fixture.id}:`, response.MessageId);
    } catch (error) {
      logger.error('Error sending message:', error);
    }
  }
}

// Run the script
sendTestFixtures()
  .then(() => logger.info('Finished sending test fixtures'))
  .catch(logger.error);
