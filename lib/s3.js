import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Config from '../config/index.js';

class S3Service {
    constructor() {
        const isLocal = process.env.NODE_ENV === 'local';
        
        this.s3Client = new S3Client({
            region: isLocal ? 'us-east-1' : 'us-west-2',
            endpoint: isLocal ? 'http://localhost:4566' : undefined,
            forcePathStyle: isLocal, // Required for LocalStack
            credentials: {
                accessKeyId: isLocal ? 'test' : Config.AWS_ACCESS_KEY_ID,
                secretAccessKey: isLocal ? 'test' : Config.AWS_SECRET_ACCESS_KEY,
            }
        });
        this.bucketName = 'dev-fixtures-daily-details-bucket';
    }

    async uploadFile(fileName, fileContent, contentType = 'text/csv') {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: fileContent,
                ContentType: contentType,
                ACL: 'private'
            });

            const result = await this.s3Client.send(command);
            console.log(`File uploaded successfully to S3: s3://${this.bucketName}/${fileName}`);
            return result;
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw error;
        }
    }

    async uploadCsvFile(fileName, csvContent) {
        return this.uploadFile(fileName, csvContent, 'text/csv');
    }
}

export default S3Service; 