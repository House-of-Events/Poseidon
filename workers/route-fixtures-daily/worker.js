
import FixturesDailyConsumer from './consumer.js';
import config from '../../config/index.js';

const consumer = new FixturesDailyConsumer(config.sqs_fixtures_daily_queue_url, 10);

['SIGINT', 'SIGTERM'].forEach(async (signal) => {
    process.on(signal, async () => {
        console.log(`Received ${signal}, shutting down...`);
        await consumer.stop();
        process.exit(0);
    });
});

consumer.start();
