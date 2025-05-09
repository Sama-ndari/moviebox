// // users/users.service.ts
// import {
//     Injectable,
//     NotFoundException,
//     BadRequestException,
//     ConflictException,
//   } from '@nestjs/common';
//   import { InjectModel } from '@nestjs/mongoose';
//   import { Model, Types } from 'mongoose';
//   import { User, UserRole } from './schemas/user.schema';
//   import { CreateUserDto } from './dto/create-user.dto';
//   import { UpdateUserDto } from './dto/update-user.dto';
//   import { QueryUsersDto } from './dto/query-users.dto';
  
//   @Injectable()
//   export class UsersService {
//     constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  
//     /**
//      * Create a new user
//      */
//     async create(createUserDto: CreateUserDto): Promise<User> {
//       const { email, username } = createUserDto;
  
//       // Check if user already exists
//       const existingUser = await this.userModel.findOne({
//         $or: [{ email }, { username }],
//       });
  
//       if (existingUser) {
//         if (existingUser.email === email) {
//           throw new ConflictException('Email already in use');
//         } else {
//           throw new ConflictException('Username already in use');
//         }
//       }
  
//       const createdUser = new this.userModel(createUserDto);
//       return createdUser.save();
//     }
  
//     /**
//      * Find all users with pagination, filtering and sorting
//      */
//     async findAll(queryDto: QueryUsersDto) {
//       const { page = 1, limit = 10, role, username, email, sortBy = 'createdAt', sortDirection = 'desc' } = queryDto;
//       const skip = (page - 1) * limit;
      
//       // Build filter object
//       const filter: any = {};
//       if (role) filter.role = role;
//       if (username) filter.username = { $regex: username, $options: 'i' };
//       if (email) filter.email = { $regex: email, $options: 'i' };
      
//       // Build sort object
//       const sort: any = {};
//       sort[sortBy] = sortDirection === 'asc' ? 1 : -1;
      
//       // Execute query with pagination
//       const [users, total] = await Promise.all([
//         this.userModel
//           .find(filter)
//           .sort(sort)
//           .skip(skip)
//           .limit(limit)
//           .exec(),
//         this.userModel.countDocuments(filter).exec(),
//       ]);
      
//       // Map users to sanitized format
//       const sanitizedUsers = users.map(user => this.sanitizeUser(user));
      
//       return {
//         data: sanitizedUsers,
//         meta: {
//           total,
//           page,
//           limit,
//           pages: Math.ceil(total / limit),
//         },
//       };
//     }
  
//     /**
//      * Find user by ID
//      */
//     async findById(id: string): Promise<User> {
//       if (!Types.ObjectId.isValid(id)) {
//         throw new BadRequestException('Invalid user ID');
//       }
      
//       const user = await this.userModel.findById(id).exec();
      
//       if (!user) {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
      
//       return user;
//     }
  
//     /**
//      * Find user by username
//      */
//     async findByUsername(username: string): Promise<User> {
//       const user = await this.userModel.findOne({ username }).exec();
      
//       if (!user) {
//         throw new NotFoundException(`User with username ${username} not found`);
//       }
      
//       return user;
//     }
  
//     /**
//      * Find user by email
//      */
//     async findByEmail(email: string): Promise<User> {
//       const user = await this.userModel.findOne({ email }).exec();
      
//       if (!user) {
//         throw new NotFoundException(`User with email ${email} not found`);
//       }
      
//       return user;
//     }
  
//     /**
//      * Update user by ID
//      */
//     async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
//       if (!Types.ObjectId.isValid(id)) {
//         throw new BadRequestException('Invalid user ID');
//       }
      
//       // Check if email or username already exists
//       if (updateUserDto.email || updateUserDto.username) {
//         const query: any = { _id: { $ne: id } };
//         if (updateUserDto.email) query.email = updateUserDto.email;
//         if (updateUserDto.username) query.username = updateUserDto.username;
        
//         const existingUser = await this.userModel.findOne(query).exec();
        
//         if (existingUser) {
//           if (updateUserDto.email && existingUser.email === updateUserDto.email) {
//             throw new ConflictException('Email already in use');
//           }
//           if (updateUserDto.username && existingUser.username === updateUserDto.username) {
//             throw new ConflictException('Username already in use');
//           }
//         }
//       }
//     }