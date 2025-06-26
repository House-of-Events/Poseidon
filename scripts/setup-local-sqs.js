import { SQSClient, CreateQueueCommand, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
});

async function setupLocalSQS() {
    try {
        console.log('Setting up local SQS queue...');
        
        // Create the queue
        const createQueueCommand = new CreateQueueCommand({
            QueueName: 'fixtures-daily-queue'
        });
        
        const result = await sqsClient.send(createQueueCommand);
        console.log('Queue created successfully:', result.QueueUrl);
        
        // Send a test message
        const testMessage = {
            fixture_id: 'mat_791647',
            match_id: 'soccer:2025-06-29:Fla:Bay',
            date_time_of_match: '2024-06-26T15:00:00Z',
            fixture_type: 'soccer',
            count_users_to_inform: 150,
            count_users_successfully_notified: 0,
            count_users_failed_to_notify: 0,
            notification_type: 'slack',
            notification_status: 'pending'
        };
        
        const sendMessageCommand = new SendMessageCommand({
            QueueUrl: result.QueueUrl,
            MessageBody: JSON.stringify(testMessage)
        });
        
        await sqsClient.send(sendMessageCommand);
        console.log('Test message sent successfully');
        
        return result.QueueUrl;
    } catch (error) {
        console.error('Error setting up SQS:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupLocalSQS()
        .then(() => {
            console.log('Local SQS setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

export default setupLocalSQS; 