import { Injectable, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, MarkNotificationReadDto, BatchNotificationDto } from './dto/notification.dto';
import { UserService } from '../user/user.service';
import { NotificationGateway } from './notification.gateway';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;
  private templates: { [key: string]: handlebars.TemplateDelegate } = {};
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    private readonly notificationGateway: NotificationGateway,
    private readonly responseService: ResponseService,
  ) {
    Logger.log('EmailService initialized');
    this.transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || '',
      host: process.env.SMTP_HOST || '',
      port: process.env.SMTP_PORT || 0,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: { rejectUnauthorized: false },
    }, {
      from: {
        name: process.env.EMAIL_FROM_NAME || '',
        address: process.env.EMAIL_FROM_ADDRESS || '',
      },
    });


    this.loadTemplates();
  }

  private loadTemplates() {
    const templatesFolderPath = path.resolve(__dirname, 'templates');
    if (!fs.existsSync(templatesFolderPath)) {
      Logger.error(`Templates folder not found at path: ${templatesFolderPath}`);
      return;
    }
    const templateFiles = fs.readdirSync(templatesFolderPath);

    templateFiles.forEach(file => {
      const templateName = path.basename(file, '.hbs');
      const templatePath = path.join(templatesFolderPath, file);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      this.templates[templateName] = handlebars.compile(templateSource);
    });

    Logger.log('📩 Email templates loaded successfully');
  }

  async notifyUser(dto: CreateNotificationDto) {
    try {
      const { userId, message, type, senderId, priority, deliveryMethod, expiresAt, relatedLink } = dto;

      const userResponse = await this.userService.findOne(userId);
      if (userResponse.statusCode !== 200) throw new NotFoundException('User not found');
      const user = userResponse.data;

      const preferences = await this.userService.getPreferences(userId);
      if (preferences.doNotDisturb) {
        Logger.log(`Skipping notification for user ${userId} due to Do Not Disturb`);
        return this.responseService.responseSuccess({ message: 'Notification skipped due to Do Not Disturb settings' });
      }

      const allowedDelivery = preferences.deliveryMethods.includes(deliveryMethod || '') ? deliveryMethod : preferences.deliveryMethods[0] || 'InApp';
      const personalizedMessage = `${message} (Recommended for your interest in ${preferences.genres.join(', ')})`;

      const notification = new this.notificationModel({
        user: userId,
        message: personalizedMessage,
        type,
        sender: senderId,
        priority,
        deliveryMethod: allowedDelivery,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        relatedLink,
      });

      const savedNotification = await CommonHelpers.retry(() => notification.save());

      if (allowedDelivery === 'Email' || allowedDelivery === 'Both') {
        await this.sendEmail(user.email, 'MovieBox Notification', 'notification', {
          message: personalizedMessage,
          link: relatedLink,
          currentYear: new Date().getFullYear(),
          userName: user.username,
        });
      }

      this.notificationGateway.server.emit('newNotification', savedNotification);
      await CommonHelpers.invalidateCache([`notifications:${userId}`]);
      return this.responseService.responseCreateSuccess('Notification created successfully', savedNotification);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async notifyUsers(dto: BatchNotificationDto) {
    try {
      const { userIds, message, priority, deliveryMethod, expiresAt, relatedLink } = dto;

      const usersResponse = await this.userService.findMany(userIds);
      if (!usersResponse) throw new NotFoundException('Some users not found');
      const users = usersResponse as unknown as Array<{ _id: Types.ObjectId; email?: string; username?: string }>;

      const notifications: any[] = [];
      for (const user of users) {
        const preferences = await this.userService.getPreferences(user._id.toString());
        if (preferences.doNotDisturb) continue;

        const allowedDelivery = preferences.deliveryMethods.includes(deliveryMethod || '') ? deliveryMethod : preferences.deliveryMethods[0] || 'InApp';
        const personalizedMessage = `${message} (Recommended for your interest in ${preferences.genres.join(', ')})`;

        notifications.push({
          user: user._id,
          message: personalizedMessage,
          priority,
          deliveryMethod: allowedDelivery,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          relatedLink,
        });

        if (allowedDelivery === 'Email' && user?.email) {
          await this.sendEmail(user.email, 'MovieBox Notification', 'notification', {
            title: 'New Notification',
            message: personalizedMessage,
            userName: user?.username || 'User',
            actionUrl: relatedLink || 'https://moviebox.com/notifications',
          });
        }
      }

      const createdNotifications = await CommonHelpers.retry(() => this.notificationModel.insertMany(notifications));
      this.notificationGateway.server.emit('newNotifications', createdNotifications);
      await CommonHelpers.invalidateCacheByPattern('notifications:*');
      return this.responseService.responseCreateSuccess('Batch notifications created successfully', createdNotifications);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getNotifications(userId: string) {
    const cacheKey = `notifications:${userId}`;
    const fetchFn = async () => {
      const userResponse = await this.userService.findOne(userId);
      if (userResponse.statusCode !== 200) throw new NotFoundException('User not found');

      return this.notificationModel.find({ user: userId, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }).sort({ createdAt: -1 }).exec();
    };

    try {
      const notifications = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(notifications);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async markNotificationRead(userId: string, dto: MarkNotificationReadDto) {
    try {
      const notification = await CommonHelpers.retry(() => this.notificationModel.findOne({ _id: dto.notificationId, user: userId }).exec());
      if (!notification) throw new NotFoundException('Notification not found');

      notification.isRead = true;
      const updatedNotification = await CommonHelpers.retry(() => notification.save());

      await CommonHelpers.invalidateCache([`notifications:${userId}`]);
      return this.responseService.responseUpdateSuccess('Notification marked as read', updatedNotification);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async clearExpiredNotifications() {
    try {
      await CommonHelpers.retry(() => this.notificationModel.deleteMany({ expiresAt: { $lt: new Date() } }).exec());
      await CommonHelpers.invalidateCacheByPattern('notifications:*');
      return this.responseService.responseSuccess({ message: 'Expired notifications cleared' });
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  private async sendEmail(to: string, subject: string, templateName: string, data: any) {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
      }

      const html = this.templates[templateName](data);
      const mailOptions = { to, subject, html };

      await CommonHelpers.retry(() => this.transporter.sendMail(mailOptions));
      Logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      Logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendLoginCredentials(userEmail: string, username: string, tempPassword: string) {
    await this.sendEmail(userEmail, 'Vos identifiants de connexion', 'account', {
      userEmail,
      tempPassword,
      username,
      loginLink: process.env.LOGIN_URL || '',
      currentYear: new Date().getFullYear(),
    });
  }

  async sendUpdateCredentials(userEmail: string, username: string, tempPassword: string) {
    await this.sendEmail(userEmail, 'Vos nouveaux identifiants de connexion', 'updatePassword', {
      userEmail,
      tempPassword,
      username,
      loginLink: process.env.LOGIN_URL || '',
      currentYear: new Date().getFullYear(),
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetLink: string) {
    await this.sendEmail(userEmail, 'Password Reset Request', 'password-reset', {
      resetLink,
      currentYear: new Date().getFullYear(),
    });
  }
}