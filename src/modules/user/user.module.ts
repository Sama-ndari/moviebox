import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './entities/user.entity';
import { UserPreferences, UserPreferencesSchema } from '../user-preferences/entities/user-preferences.entity';
import { Person, PersonSchema } from '../person/entities/person.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    forwardRef(() => NotificationModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserPreferences.name, schema: UserPreferencesSchema },
      { name: Person.name, schema: PersonSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}