import newSQSClient from '../../lib/sqs.js';
import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';

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
            console.log('consumer is already running');
            return;
        }

        this.#isRunning = true;
        this.#isDone = false;
        console.log('starting consumer');

        while (this.isRunning() || !this.#isDone) {
            try {
                await this.processFixtures();
                await new Promise(resolve => setTimeout(resolve, 10000));
            } catch (error) {
                console.error('error processing fixtures', error);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        console.log('consumer stopped, exiting loop');
    }

    async stop() {
        if (!this.isRunning() && !this.#isDone) {
            console.log('consumer is already stopped, cannot stop again');
            return;
        }

        console.log('stopping consumer');
        this.#isRunning = false;
        let count = 0;
        while (!this.#isDone) {
            count++;
            await new Promise(resolve => setTimeout(resolve, 5000));
            if (count > 10) {
                console.log('consumer did not stop after 10 seconds, force stopping');
                break;
            }
        }

        console.log('consumer stopped');
    }

    async getFixtures() {
        console.log('getting fixtures');
        const fixtures = [];
        let totalReceived = 0;
        const startTime = Date.now();

        while (totalReceived < this.#maxMessages) {
            const remaining = this.#maxMessages - totalReceived;
            const batchSize = Math.min(this.#batchSize, remaining);
            const pollLength = 1;
            const command = new ReceiveMessageCommand({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: batchSize,
                WaitTimeSeconds: pollLength,
            });

            try {
                const result = await this.#sqsClient.send(command);
                if (!result.Messages || result.Messages.length === 0) {
                    console.log('no fixtures found in queue, exiting', { total_received: totalReceived, remaining: remaining });
                    break;
                }

                fixtures.push(...result.Messages);
                totalReceived += result.Messages.length;
                console.log('received fixtures', { total_received: totalReceived, remaining: remaining });
            } catch (error) {
                console.error('error receiving fixtures from queue', error);
                throw error;
            }
        }
        const duration = (Date.now() - startTime) / 1000;
        console.log(`received ${totalReceived} fixtures in ${duration} seconds`);
        return fixtures;
    }

    async processFixtures() {
        console.log('processing fixtures');
        let fixtures;
        try {
            if (!this.isRunning()) {
                this.markDone();
                return;
            }

            fixtures = await this.getFixtures();
            if (fixtures.length === 0) {
                console.log('no fixtures found');
                return;
            }
            if (!this.isRunning()) {
                this.markDone();
                return;
            }
            console.log('received fixtures', { count: fixtures.length });

        } catch (error) {
            console.error('error getting fixtures', error);
            return;
        }

        console.log('got fixtures', fixtures);
    }
}

export default FixturesDailyConsumer;