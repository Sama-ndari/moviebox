import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class UploadsService {
  constructor(private readonly userService: UserService) {}

  async saveProfilePicture(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filePath = `/profiles/${file.filename}`;
    await this.userService.update(userId, { profileImageUrl: filePath });

    return { filePath };
  }
}
