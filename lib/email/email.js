import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import { generateEmailBody, generateEmailSubject } from './render-email.js';

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        return nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_SECURE,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASSWORD
            }
        });
    }


    async sendFixtureEmail(user, fixtureData) {
        try {
            const sportType = fixtureData.sport_type;
            if (!sportType) {
                throw new Error('Sport type not found');
            }
            const subject = generateEmailSubject(fixtureData, sportType);
            const htmlBody = generateEmailBody(fixtureData, sportType);

            const mailOptions = {
                from: config.SMTP_FROM,
                to: user.email,
                subject: subject,
                html: htmlBody
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: info.messageId,
                to: user.email
            };

        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.message,
                to: user.email
            };
        }
    }

    async sendBulkFixtureEmails(users, fixtureData) {
        const results = [];
        
        for (const user of users) {
            
            if (user.email) {
                const result = await this.sendFixtureEmail(user, fixtureData);
                results.push(result);
                
                // Add a small delay to avoid overwhelming the SMTP server
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                console.log(`Skipping user ${user.user_id} - no email address`);
            }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
                
        return {
            total: results.length,
            successful,
            failed,
            results
        };
    }
}

export default EmailService;
