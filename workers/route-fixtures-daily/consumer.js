import FixtureDailyService from '../../route-fixture-daily/route-fixtures-daily.js';
import newSQSClient from '../../lib/sqs.js';
import { ReceiveMessageCommand, DeleteMessageBatchCommand } from '@aws-sdk/client-sqs';
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
            console.log('consumer is already running');
            return;
        }

        this.#isRunning = true;
        this.#isDone = false;
        console.log('starting consumer');

        while (this.isRunning() || !this.#isDone) {
            try {
                await this.processFixtures();
                console.log('Waiting for 600 seconds for next batch');
                await new Promise(resolve => setTimeout(resolve, 600000));
            } catch (error) {
                console.error('error processing fixtures', error);
                await new Promise(resolve => setTimeout(resolve, 600000));
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
            await new Promise(resolve => setTimeout(resolve, 10000));
            if (count > 30) {
                console.log('consumer did not stop after 30 seconds, force stopping');
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
            const pollLength = 30; 
            const command = new ReceiveMessageCommand({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: batchSize,
                WaitTimeSeconds: pollLength,
            });

            try {
                const result = await this.#sqsClient.send(command);
                if (!result.Messages || result.Messages.length === 0) {
                    console.log('no fixtures found in queue after long poll, exiting', { total_received: totalReceived, remaining: remaining });
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


    async handleFixtures(fixtures) {
        console.log('handling fixtures', { count: fixtures.length });
        try{
            // Save fixtures to database
            await fixtureDailyService.saveFixtures(fixtures);
        }catch(error){
            console.error('error saving fixtures', error);
            throw error;
        }
    }


    async deleteFixtures(fixtures) {
        if(!fixtures || fixtures.length === 0){
            console.log('no fixtures to delete');
            return;
        }
        const BATCH_SIZE = 10;
        try{
            for(let i = 0; i < fixtures.length; i += BATCH_SIZE){
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
            }
        } catch(error){
            console.error('error deleting fixtures from sqs queue', error);
            throw error;
        }
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

            // Parse fixture body 
            const fixtureBodies = fixtures.map((fixture)=>{
                try{
                    return JSON.parse(fixture.Body);
                }catch(error){
                    console.error('error parsing fixture body', error, 'fixtureBody', fixture.Body);
                    throw error;
                }
            })
            if (!this.isRunning()) {
                this.markDone();
                return;
            }

            // Process all fixtures
            console.log('About to handle fixtures');
            await this.handleFixtures(fixtureBodies);

            console.log('successfully processed messages', { count: fixtures.length });

            // Call API to create csv with list of users to inform based on fixture_type
            await fixtureDailyService.createCsv(fixtureBodies);
 
            // Delete all fixtures from the queue
            await this.deleteFixtures(fixtures);
            console.log('successfully deleted fixtures', { count: fixtures.length });
        
            

        } catch (error) {
            console.error('error getting fixtures', error);
            return;
        }
    }
}

export default FixturesDailyConsumer;