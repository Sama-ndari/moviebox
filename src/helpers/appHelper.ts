import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
// Simple email validation using regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppHelperService {
  private readonly logger = new Logger(AppHelperService.name);

  constructor(private readonly configService: ConfigService) {}

  private _decodeJwt(req): jwt.JwtPayload | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    try {
      return jwt.decode(token) as jwt.JwtPayload;
    } catch (error) {
      this.logger.error('Failed to decode JWT', error.stack);
      return null;
    }
  }

  getUserInfo(req) {
    return this._decodeJwt(req);
  }

  getUserId(req) {
    const decoded = this._decodeJwt(req);
    return decoded ? decoded.sub : null;
  }

  getIp(req) {
    return req.socket.remoteAddress;
  }

  dateFromDay(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }

  async foreignKeyResolver(model, id): Promise<boolean> {
    try {
      const data = await model.findOne({ _id: id });
      if (data) return true;
      throw new Error(`The ID ${id.toString()} does not exist.`);
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }

  async verifyAdressGmail(email: string): Promise<any> {
    // First check if the email is valid using regex
    if (!emailRegex.test(email)) {
      return {
        success: false,
        info: `${email} is not a valid email format`,
        addr: email
      };
    }

    // Check if it's a non-professional email (like gmail, yahoo, etc.)
    if (this.isNonProfessionalEmail(email)) {
      // For non-professional emails, we'll just do basic validation
      return {
        success: true,
        info: `${email} is a valid email address`,
        addr: email,
        isPro: false
      };
    }

    // For professional emails, check MX records
    try {
      const addresses = await this.isProfessionalEmail(email);
      if (!addresses || addresses.length === 0 || !addresses[0]?.exchange) {
        return {
          success: false,
          info: `${email} does not have valid MX records`,
          addr: email
        };
      }
      
      return {
        success: true,
        info: `${email} is a valid professional email address`,
        addr: email,
        isPro: true
      };
    } catch (error) {
      this.logger.error(`Email verification failed for ${email}:`, error);
      return { 
        success: false,
        error: 'Email verification failed',
        addr: email
      };
    }
  }

  isProfessionalEmail(email: string): Promise<dns.MxRecord[]> {
    const domain = email.split('@')[1];
    return new Promise((resolve) => {
      dns.resolve(domain, 'MX', (error, addresses) => {
        if (error || !addresses || addresses.length === 0) resolve([]);
        else resolve(addresses);
      });
    });
  }

  isNonProfessionalEmail(email: string): boolean {
    const domain = email.split('@')[1];
    const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    if (publicDomains.includes(domain)) return true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailRegex.test(email);
  }

  async emailSender(
    emailTo: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    } as nodemailer.TransportOptions);

    const mailOptions: nodemailer.SendMailOptions = {
      from: '"Waangu" <no-reply@waangu.com>',
      to: emailTo,
      subject,
      text,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Failed to send email', error.stack);
      return { error: "Echec d'envoi du mail" };
    }
  }

  private getFullImageUrl(imagePath: string): string {
    const uploadImageBaseUrl = this.configService.get<string>('UPLOAD_IMAGE');
    this.logger.log(`Upload image base URL: ${uploadImageBaseUrl}`);
    return `${uploadImageBaseUrl}/${imagePath}`;
  }
}
