import FixtureDailyService from '../../route-fixture-daily/route-fixtures-daily.js';
import newSQSClient from '../../lib/sqs.js';
import {
  ReceiveMessageCommand,
  DeleteMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import logger from '../../lib/logger.js';
const fixtureDailyService = new FixtureDailyService();
export class FixturesDailyConsumer {
  #isRunning;
  #isDone;
  #maxMessages;
  #batchSize;
  #sqsClient;
  constructor(queueUrl) {
    this.queueUrl = queueUrl;
    this.batchSize = 10;
    this.#isRunning = false;
    this.#maxMessages = 1000;
    this.#isDone = false;
    this.#sqsClient = newSQSClient();
  }

  isRunning() {
    return this.#isRunning;
  }

  markDone() {
    this.#isDone = true;
  }

  async start() {
    if (this.isRunning()) {
      logger.info('Consumer already running, skipping start');
      return;
    }

    this.#isRunning = true;
    this.#isDone = false;
    logger.info('Starting fixtures consumer', { queueUrl: this.queueUrl });

    while (this.isRunning() || !this.#isDone) {
      try {
        await this.processFixtures();
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        logger.error('Error processing fixtures batch', {
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    logger.info('Consumer stopped, exiting main loop');
  }

  async stop() {
    if (!this.isRunning() && !this.#isDone) {
      logger.info('Consumer already stopped');
      return;
    }

    logger.info('Stopping consumer gracefully');
    this.#isRunning = false;
    let count = 0;
    while (!this.#isDone && count < 30) {
      count++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (count >= 30) {
      logger.warn(
        'Consumer did not stop gracefully after 30 seconds, forcing stop'
      );
    } else {
      logger.info('Consumer stopped gracefully');
    }
  }

  async getFixtures() {
    const fixtures = [];
    let totalReceived = 0;
    const startTime = Date.now();

    while (totalReceived < this.#maxMessages) {
      const remaining = this.#maxMessages - totalReceived;
      const batchSize = Math.min(this.#batchSize, remaining);
      const pollLength = 5;
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: batchSize,
        WaitTimeSeconds: pollLength,
      });

      try {
        const result = await this.#sqsClient.send(command);
        if (!result.Messages || result.Messages.length === 0) {
          logger.debug('No messages in queue after long poll', {
            totalReceived,
            pollDuration: pollLength,
          });
          break;
        }

        fixtures.push(...result.Messages);
        totalReceived += result.Messages.length;
        logger.debug('Received batch from queue', {
          batchSize: result.Messages.length,
          totalReceived,
          remaining,
        });
      } catch (error) {
        logger.error('Failed to receive messages from queue', {
          error: error.message,
          queueUrl: this.queueUrl,
        });
        throw error;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('Completed message retrieval', {
      totalReceived,
      duration: `${duration}s`,
      avgPerSecond:
        totalReceived > 0
          ? (totalReceived / parseFloat(duration)).toFixed(2)
          : 0,
    });

    return fixtures;
  }

  async handleFixtures(fixtures) {
    logger.info('Processing fixtures batch', { count: fixtures.length });
    try {
      await fixtureDailyService.saveFixtures(fixtures);
      logger.info('Successfully saved fixtures to database', {
        count: fixtures.length,
      });
    } catch (error) {
      logger.error('Failed to save fixtures to database', {
        error: error.message,
        count: fixtures.length,
      });
      throw error;
    }
  }

  async deleteFixtures(fixtures) {
    if (!fixtures || fixtures.length === 0) {
      logger.debug('No fixtures to delete');
      return;
    }

    const BATCH_SIZE = 10;
    let deletedCount = 0;

    try {
      for (let i = 0; i < fixtures.length; i += BATCH_SIZE) {
        const batch = fixtures.slice(i, i + BATCH_SIZE);
        const entries = batch.map((fixture, index) => ({
          Id: index.toString(),
          ReceiptHandle: fixture.ReceiptHandle,
        }));
        const command = new DeleteMessageBatchCommand({
          QueueUrl: this.queueUrl,
          Entries: entries,
        });
        await this.#sqsClient.send(command);
        deletedCount += batch.length;
      }
      logger.info('Successfully deleted fixtures from queue', { deletedCount });
    } catch (error) {
      logger.error('Failed to delete fixtures from queue', {
        error: error.message,
        attemptedCount: fixtures.length,
      });
      throw error;
    }
  }

  async processFixtures() {
    let fixtures;
    try {
      if (!this.isRunning()) {
        this.markDone();
        return;
      }

      fixtures = await this.getFixtures();
      if (fixtures.length === 0) {
        return;
      }

      if (!this.isRunning()) {
        this.markDone();
        return;
      }

      // Parse fixture body
      const fixtureBodies = fixtures.map((fixture, index) => {
        try {
          return JSON.parse(fixture.Body);
        } catch (error) {
          logger.error('Failed to parse fixture body', {
            error: error.message,
            fixtureIndex: index,
            bodyPreview: fixture.Body.substring(0, 100),
          });
          throw error;
        }
      });

      if (!this.isRunning()) {
        this.markDone();
        return;
      }

      await this.handleFixtures(fixtureBodies);

      logger.info('successfully processed messages', {
        count: fixtures.length,
      });

      // Call API to create csv with list of users to inform based on fixture_type
      await fixtureDailyService.createCsv(fixtureBodies);
      await this.deleteFixtures(fixtures);

      logger.info('Successfully processed fixtures batch', {
        processedCount: fixtures.length,
        fixtureTypes: [...new Set(fixtureBodies.map(f => f.fixture_type))],
      });
    } catch (error) {
      logger.error('Failed to process fixtures batch', {
        error: error.message,
        attemptedCount: fixtures?.length || 0,
      });
    }
  }
}

export default FixturesDailyConsumer;
