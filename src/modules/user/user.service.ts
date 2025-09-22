// users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Person, PersonDocument } from '../person/entities/person.entity';
import { UserPreferences } from '../user-preferences/entities/user-preferences.entity';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Person.name) private personModel: Model<PersonDocument>,
        @InjectModel(UserPreferences.name) private userPreferencesModel: Model<UserPreferences>,
        private readonly responseService: ResponseService,
        @Inject(forwardRef(() => NotificationService)) private readonly notificationService: NotificationService,
    ) { }

    async create(createUserDto: CreateUserDto) {
        try {
            const { email, username } = createUserDto;

            const existingUser = await CommonHelpers.retry(() => this.userModel.findOne({ $or: [{ email }, { username }] }).exec());
            if (existingUser) {
                if (existingUser.email === email) {
                    throw new ConflictException('Email already in use');
                } else {
                    throw new ConflictException('Username already in use');
                }
            }

            const createdUser = new this.userModel(createUserDto);
            const savedUser = await CommonHelpers.retry(() => createdUser.save());
            await CommonHelpers.invalidateCacheByPattern('users:*');
            return savedUser;
        } catch (error) {
            // Re-throw the error to be handled by the calling service
            throw error;
        }
    }

    async findAll(queryDto: QueryUsersDto) {
        const cacheKey = `users:all:${JSON.stringify(queryDto)}`;
        const fetchFn = async () => {
            const { page = 1, limit = 10, role, username, email, sortBy = 'createdAt', sortDirection = 'desc' } = queryDto;
            const skip = (page - 1) * limit;
            const filter: any = {};
            if (role) filter.role = role;
            if (username) filter.username = { $regex: username, $options: 'i' };
            if (email) filter.email = { $regex: email, $options: 'i' };
            const sort: any = { [sortBy]: sortDirection === 'asc' ? 1 : -1 };

            const [users, total] = await Promise.all([
                this.userModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
                this.userModel.countDocuments(filter).exec(),
            ]);

            const sanitizedUsers = users.map(user => this.sanitizeUser(user));
            return { data: sanitizedUsers, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
        };

        try {
            return await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async findMany(userIds: string[]): Promise<UserDocument[]> {
        const validIds = userIds.filter((id) => Types.ObjectId.isValid(id));

        if (validIds.length === 0) {
            throw new BadRequestException('No valid user IDs provided');
        }

        const users = await this.userModel.find({ _id: { $in: validIds } }).exec();

        if (users.length === 0) {
            throw new NotFoundException('No users found for the provided IDs');
        }

        return users;
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid user ID: ${id}`);
        const cacheKey = `user:${id}`;
        const fetchFn = async () => {
            const user = await this.userModel.findById(id).exec();
            if (!user) throw new NotFoundException(`User with ID ${id} not found`);
            return this.sanitizeUser(user);
        };

        try {
            return await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async findByUsername(username: string): Promise<UserDocument> {
        const user = await this.userModel.findOne({ username }).exec();

        if (!user) {
            throw new NotFoundException(`User with username ${username} not found`);
        }

        return user;
    }

    async findByEmail(email: string): Promise<UserDocument> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid user ID: ${id}`);
        try {
            if (updateUserDto.email) {
                const existingUser = await this.userModel.findOne({ email: updateUserDto.email, _id: { $ne: id } }).exec();
                if (existingUser) throw new ConflictException('Email already in use');
            }

            if (updateUserDto.username) {
                const existingUser = await this.userModel.findOne({ username: updateUserDto.username, _id: { $ne: id } }).exec();
                if (existingUser) throw new ConflictException('Username already in use');
            }

            const updatedUser = await CommonHelpers.retry(() => this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec());
            if (!updatedUser) throw new NotFoundException(`User with ID ${id} not found`);

            await CommonHelpers.invalidateCache([`user:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('users:*');
            return this.responseService.responseUpdateSuccess('User updated successfully', this.sanitizeUser(updatedUser));
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid user ID: ${id}`);
        try {
            const result = await CommonHelpers.retry(() => this.userModel.findByIdAndDelete(id).exec());
            if (!result) throw new NotFoundException(`User with ID ${id} not found`);

            await CommonHelpers.invalidateCache([`user:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('users:*');
            return this.responseService.responseDeleteSuccess('User deleted successfully', null);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    sanitizeUser(user: UserDocument): Partial<User> {
        const sanitized = user.toObject();
        delete sanitized.password;
        return sanitized;
    }

    async getPreferences(userId: string) {
        const cacheKey = `user:${userId}:preferences`;
        const fetchFn = async () => {
            const preferences = await this.userPreferencesModel.findOne({ user: userId }).exec();
            if (!preferences) {
                return this.userPreferencesModel.create({
                    user: userId,
                    contentTypes: ['Movies', 'TVShows'],
                    genres: ['Action', 'Drama'],
                    notificationFrequency: 'Instant',
                    deliveryMethods: ['InApp', 'Email'],
                });
            }
            return preferences;
        };

        try {
            return await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async follow(userId: string, followId: string) {
        if (userId === followId) throw new BadRequestException('You cannot follow yourself.');

        try {
            await this.userModel.updateOne({ _id: userId, following: { $ne: followId } }, { $push: { following: followId } }).exec();
            await this.userModel.updateOne({ _id: followId, followers: { $ne: userId } }, { $push: { followers: userId } }).exec();

            const followerResponse = await this.findOne(userId);
            if (followerResponse.statusCode !== 200) return;
            const follower = followerResponse.data;

            await this.notificationService.notifyUser({
                userId: followId,
                senderId: userId,
                type: NotificationType.NEW_FOLLOWER,
                message: `${follower.username} started following you.`,
            });

            await CommonHelpers.invalidateCache([`user:${userId}`, `user:${followId}`]);
            await CommonHelpers.invalidateCacheByPattern(`user:*`);
            
            return this.responseService.responseSuccess({ message: 'User followed successfully' });
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async unfollow(userId: string, unfollowId: string) {
        try {
            await this.userModel.updateOne({ _id: userId }, { $pull: { following: unfollowId } }).exec();
            await this.userModel.updateOne({ _id: unfollowId }, { $pull: { followers: userId } }).exec();

            await CommonHelpers.invalidateCache([`user:${userId}`, `user:${unfollowId}`]);
            await CommonHelpers.invalidateCacheByPattern(`user:*`);
            return this.responseService.responseSuccess({ message: 'User unfollowed successfully' });
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }
}