import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UserModule } from '../user/user.module';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    UserModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
