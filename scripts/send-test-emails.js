import EmailService from '../lib/email.js';
import logger from '../lib/logger.js';
// Sample fixture data (similar to what you provided)
const sampleFixtureData = {
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
  away_team: 'Auckland City',
  date_time: '2025-06-15T16:00:00.000Z',
  home_team: 'Bayern München',
  timestamp: 1750003200,
  sport_type: 'soccer',
  teams_details: {
    away: {
      id: 2537,
      logo: 'https://media.api-sports.io/football/teams/2537.png',
      name: 'Auckland City',
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
};

// Sample user data
const sampleUsers = [
  {
    user_id: 'user_123',
    id: 'sub_456',
    channel_id: 'channel_789',
    sport_type: 'soccer',
    subscribed_at: '2024-01-01T00:00:00Z',
    is_active: true,
    email: 'test@example.com', // Replace with your email for testing
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

async function testEmailService() {
  logger.info('Testing Email Service...');

  const emailService = new EmailService();

  try {
    // Test single email
    logger.info('\n1. Testing single email...');
    const result = await emailService.sendFixtureEmail(
      sampleUsers[0],
      sampleFixtureData
    );
    logger.info('Single email result:', result);

    // Test bulk emails
    logger.info('\n2. Testing bulk emails...');
    const bulkResult = await emailService.sendBulkFixtureEmails(
      sampleUsers,
      sampleFixtureData
    );
    logger.info('Bulk email result:', bulkResult);
  } catch (error) {
    logger.error('Error testing email service:', error);
  }
}

// Run the test
testEmailService();
