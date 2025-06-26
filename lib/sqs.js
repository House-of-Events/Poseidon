import { SQSClient } from '@aws-sdk/client-sqs';
import { HttpsAgent } from 'agentkeepalive';
import { NodeHttpHandler } from '@smithy/node-http-handler';

const IDLE_SOCKET_TIMEOUT = 40000; // 40 seconds

function newSQSClient() {
    // Check if we're running locally (using LocalStack)
    const isLocal = process.env.NODE_ENV === 'local' || 
                   process.env.SQS_ENDPOINT === 'http://localhost:4566';
    
    if (isLocal) {
        return new SQSClient({
            endpoint: 'http://localhost:4566',
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'test',
                secretAccessKey: 'test'
            }
        });
    }
    
    const sqsConfig = {
        requestHandler: new NodeHttpHandler({
            httpAgent: new HttpsAgent({ freeSocketTimeout: IDLE_SOCKET_TIMEOUT }),
        }),
    };

    // Production/development configuration
    return new SQSClient(sqsConfig);
}

export default newSQSClient;