import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NewContentNotificationJobData } from './notification-job.processor';

export interface ImageJobData {
  imageUrl: string;
  tmdbId: number;
  type: 'poster' | 'backdrop' | 'profile';
  imagePath: string;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('image-processing') private readonly imageQueue: Queue,
    @InjectQueue('notification-processing') private readonly notificationQueue: Queue,
  ) {}

  async addImageDownloadJob(data: ImageJobData) {
    await this.imageQueue.add('download-image', data, { attempts: 3 });
  }

  async addNewContentNotificationJob(data: NewContentNotificationJobData) {
    await this.notificationQueue.add('new-content-notification', data, { attempts: 3 });
  }
}
