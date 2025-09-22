import { Controller, Post, UploadedFile, UseInterceptors, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user.sub;
    return this.uploadsService.saveProfilePicture(userId, file);
  }
}
