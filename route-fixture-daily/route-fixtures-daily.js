import Config from '../config/index.js';
import Knex from 'knex';
import axios from 'axios';
import S3Service from '../lib/s3.js';
import CsvService from '../lib/csv.js';
import EmailService from '../lib/email/email.js';
import { UserList } from '../test/zeus-user.js';
import logger from '../lib/logger.js';
// Environment-specific SSL configuration
const isLocal = process.env.NODE_ENV === 'local';
const sslConfig = isLocal
  ? false
  : {
      rejectUnauthorized: false,
    };

const fixtureDailyDb = Knex({
  client: 'postgresql',
  connection: {
    host: Config.DB_HOST,
    user: Config.DB_USER,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    port: Config.DB_PORT,
    ssl: sslConfig,
  },
});

class FixtureDailyService {
  constructor(db) {
    this.db = db;
    this.emailService = new EmailService();
  }

  async bulkUpsert(records, { updateColumns }) {
    if (!fixtureDailyDb) {
      logger.info('Fixture daily database not enabled, skipping bulk upsert', {
        recordCount: records.length,
      });
      return;
    }

    try {
      // Map incoming data to database column names
      const recordsToInsert = records.map(record => ({
        fixture_id: record.fixture_id,
        match_id: record.match_id,
        date_time_of_match: record.date_time,
        fixture_type: record.fixture_type,
        count_users_to_inform: record.count_users_to_inform || 0,
        count_users_successfully_notified:
          record.count_users_successfully_notified || 0,
        count_users_failed_to_notify: record.count_users_failed_to_notify || 0,
        notification_type: record.notification_type || 'slack',
        notification_status: record.notification_status || 'pending',
        fixture_data: record.fixture_data || null,
      }));

      // Perform simple bulk insert
      const results = await fixtureDailyDb('daily_fixtures_routed')
        .insert(recordsToInsert)
        .returning('*');

      logger.info('Database bulk insert completed', {
        recordCount: records.length,
        insertedCount: results.length,
        fixtureTypes: [...new Set(records.map(r => r.fixture_type))],
      });

      return results;
    } catch (err) {
      logger.error('Database bulk insert failed', {
        recordCount: records.length,
        error: err.message,
        fixtureTypes: [...new Set(records.map(r => r.fixture_type))],
      });
      throw err;
    }
  }

  async updateEmailCounts(fixtureId, successfulCount, failedCount) {
    if (!fixtureDailyDb) {
      logger.info(
        'fixtureDailyDb is not initialized, skipping email count update'
      );
      return;
    }

    try {
      // Determine notification status based on email results
      let notificationStatus = 'pending';
      if (successfulCount > 0 && failedCount === 0) {
        notificationStatus = 'success';
      } else if (successfulCount === 0 && failedCount > 0) {
        notificationStatus = 'failed';
      } else if (successfulCount > 0 && failedCount > 0) {
        notificationStatus = 'partial';
      }

      await fixtureDailyDb('daily_fixtures_routed')
        .where('fixture_id', fixtureId)
        .update({
          count_users_successfully_notified: successfulCount,
          count_users_failed_to_notify: failedCount,
          notification_status: notificationStatus,
        });

      logger.info(
        `Updated email counts for fixture ${fixtureId}: ${successfulCount} successful, ${failedCount} failed, status: ${notificationStatus}`
      );
    } catch (error) {
      logger.error('Error updating email counts:', error);
    }
  }

  async saveFixtures(fixtures) {
    if (!fixtureDailyDb) {
      logger.info('fixtureDailyDb is not initialized');
      return;
    }
    try {
      const bulkInsert = await this.bulkUpsert(fixtures, {
        updateColumns: ['date_modified'],
      });
    } catch (error) {
      logger.error('Error saving fixtures', error);
      throw error;
    }
  }

  async createCsv(fixtures) {
    try {
      const s3Service = new S3Service();

      await Promise.all(
        fixtures.map(async fixture => {
          let users = [];

          try {
            const response = await axios.get(
              `${Config.ZEUS_API_URL}/subscribed/users/${fixture.fixture_type}`,
              {
                auth: {
                  username: Config.ZEUS_ADMIN_USERNAME,
                  password: Config.ZEUS_ADMIN_PASSWORD,
                },
              }
            );
            users = response.data;
            logger.info('Retrieved users from Zeus API', {
              fixtureType: fixture.fixture_type,
              userCount: users.length,
            });
          } catch (apiError) {
            logger.warn('Zeus API unavailable, using mock data', {
              fixtureType: fixture.fixture_type,
              status: apiError.response?.status,
              error: apiError.message,
            });
            // Mock user data for local testing
            users = UserList;
          }

          // Send emails to users if they have email addresses
          let successfulEmails = 0;
          let failedEmails = 0;

          if (users.length > 0) {
            try {
              // Prepare fixture data for email (combine fixture with fixture_data if available)
              const emailFixtureData = {
                ...fixture,
                ...(fixture.fixture_data
                  ? typeof fixture.fixture_data === 'string'
                    ? JSON.parse(fixture.fixture_data)
                    : fixture.fixture_data
                  : {}),
              };

              const emailResult = await this.emailService.sendBulkFixtureEmails(
                users,
                emailFixtureData
              );
              successfulEmails = emailResult.successful;
              failedEmails = emailResult.failed;

              logger.info(
                `Email sending completed for fixture ${fixture.fixture_id || fixture.id}: ${successfulEmails} successful, ${failedEmails} failed`
              );

              // Update database with email counts
              const fixtureId = fixture.fixture_id || fixture.id;
              await this.updateEmailCounts(
                fixtureId,
                successfulEmails,
                failedEmails
              );
            } catch (emailError) {
              logger.error('Error sending emails:', emailError);
              failedEmails = users.length; // All emails failed if there was an error
              successfulEmails = 0;

              // Update database with failed counts
              const fixtureId = fixture.fixture_id || fixture.id;
              await this.updateEmailCounts(
                fixtureId,
                successfulEmails,
                failedEmails
              );
            }
          } else {
            logger.info(
              `No users found for fixture ${fixture.fixture_id || fixture.id}, skipping email sending`
            );
          }

          // Generate CSV content
          const csvContent = CsvService.generateCsvFromUsers(users, {
            fixture_id: fixture.fixture_id || fixture.id,
            fixture_type: fixture.fixture_type,
            match_id: fixture.match_id,
            fixture_data: fixture.fixture_data,
            date_time: fixture.date_time,
          });

          // Generate filename
          const fileName = CsvService.generateFileName(fixture.fixture_type);

          // Upload to S3
          await s3Service.uploadCsvFile(fileName, csvContent);
          logger.info(`CSV file uploaded to S3: ${fileName}`);
        })
      );
    } catch (error) {
      // Dont throw error, just log it
      logger.error('Error creating csv', error);
    }
  }
}

export default FixtureDailyService;
