import Config from '../config/index.js';
import Knex from 'knex';

// Environment-specific SSL configuration
const isLocal = process.env.NODE_ENV === 'local';
const sslConfig = isLocal ? false : {
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
    }
});

class FixtureDailyService {
    constructor(db){
        this.db = db;
    }

    async bulkUpsert(records, { updateColumns }) {
        if (!fixtureDailyDb) {
          console.log('Fixture daily is not enabled, skipping bulk upsert', {
            record_count: records.length,
          });
          return;
        }
    
        try {
          // Map incoming data to database column names
          const recordsToInsert = records.map((record) => ({
            fixture_id: record.fixture_id,
            match_id: record.match_id,
            date_time_of_match: record.date_time_of_match,
            fixture_type: record.fixture_type,
            count_users_to_inform: record.count_users_to_inform || 0,
            count_users_successfully_notified: record.count_users_successfully_notified || 0,
            count_users_failed_to_notify: record.count_users_failed_to_notify || 0,
            notification_type: record.notification_type || 'slack',
            notification_status: record.notification_status || 'pending',
          }));
    
          // Perform simple bulk insert
          const results = await fixtureDailyDb('daily_fixtures_routed')
            .insert(recordsToInsert)
            .returning('*');
    
          console.log('Bulk insert completed successfully', {
            record_count: records.length,
            inserted_count: results.length,
          });
    
          return results;
        } catch (err) {
          console.error('Bulk insert failed', {
            record_count: records.length,
            error: err.message,
          });
          throw err;
        }
    }
    
    async saveFixtures(fixtures){
        if(!fixtureDailyDb){
            console.log('fixtureDailyDb is not initialized');
            return;
        }
        try {
            const bulkInsert = await this.bulkUpsert(fixtures, {
                updateColumns: ['date_modified']
            });
        } catch (error) {
            console.error('Error saving fixtures', error);
            throw error;
        }
    }
}

export default FixtureDailyService;