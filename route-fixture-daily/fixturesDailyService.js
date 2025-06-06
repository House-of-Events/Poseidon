import Config from '../config/index.js';
import Knex from 'knex';
const fixtureDailyDb = Knex({
    client: 'postgresql',
    connection: {
        host: Config.DB_HOST,
        user: Config.DB_USER,
        password: Config.DB_PASSWORD,
        database: Config.DB_NAME,
        port: Config.DB_PORT,
        ssl: {
            rejectUnauthorized: false,
          },
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
            id: record.id,
            home_team: record.homeTeam,
            away_team: record.awayTeam,
            competition: record.competition,
            fixture_date: record.date,
          }));
    
          // Perform single bulk upsert - only update the data columns, not date_modified
          const results = await fixtureDailyDb('daily_fixtures')
            .insert(recordsToInsert)
            .onConflict('id')
            .merge(['home_team', 'away_team', 'competition', 'fixture_date'])
            .returning('*');
    
          console.log('Bulk upsert completed successfully', {
            record_count: records.length,
            updated_count: results.length,
          });
    
          return results;
        } catch (err) {
          console.error('Bulk upsert failed', {
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