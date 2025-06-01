
const { SQSClient } = require('@aws-sdk/client-sqs');
const { HttpsAgent } = require('agentkeepalive');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const IDLE_SOCKET_TIMEOUT = 40000; // 40 seconds

const sqsConfig = {
    requestHandler: new NodeHttpHandler({
        httpAgent: new HttpsAgent({ freeSocketTimeout: IDLE_SOCKET_TIMEOUT }),
    }),
};

const newSQSClient = () => {
    return new SQSClient(sqsConfig);
};

module.exports = newSQSClient;
