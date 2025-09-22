import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { PersonService } from '../person/person.service';
import { FollowService } from '../follow/follow.service';
import { TMDbService } from '../tmdb/tmdb.service';
import { NotificationType } from '../notification/entities/notification.entity';

export interface NewContentNotificationJobData {
  personId: string;
  personName: string;
  newContentTitle: string;
}

@Processor('notification-processing')
export class NotificationJobProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationJobProcessor.name);
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly personService: PersonService,
    private readonly followService: FollowService,
    private readonly tmdbService: TMDbService,
  ) {
    super();
  }

  async process(job: Job<NewContentNotificationJobData>): Promise<any> {
    this.logger.log(`Processing notification job for person: ${job.data.personId}`);
    const { personId, personName, newContentTitle } = job.data;

    const followersResult = await this.followService.getFollowers(personId);
    const followers = followersResult.map(f => f.follower);
    this.logger.log(`Found ${followers.length} followers.`);

    for (const userId of followers) {
      await this.notificationService.notifyUser({
        userId: userId.toString(),
        type: NotificationType.NEW_CONTENT,
        message: `New content from ${personName}: ${newContentTitle}`,
        senderId: personId,
      });
    }

    return { success: true, notifiedUsers: followers.length };
  }
}
