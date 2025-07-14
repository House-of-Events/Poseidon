import FixturesDailyConsumer from './consumer.js';
import config from '../../config/index.js';
import logger from '../../lib/logger.js';

const consumer = new FixturesDailyConsumer(
  config.SQS_FIXTURES_DAILY_QUEUE_URL,
  10
);

['SIGINT', 'SIGTERM'].forEach(async signal => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down...`);
    await consumer.stop();
    process.exit(0);
  });
});

consumer.start();
