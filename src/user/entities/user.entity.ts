// // users/schemas/user.schema.ts
// import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';
// import * as bcrypt from 'bcrypt';

// export enum UserRole {
//   USER = 'user',
//   ADMIN = 'admin',
// }

// @Schema({ timestamps: true })
// export class User extends Document {
//   @Prop({ required: true, unique: true })
//   username: string;

//   @Prop({ required: true, unique: true })
//   email: string;

//   @Prop({ required: true })
//   password: string;

//   @Prop({ type: String, enum: UserRole, default: UserRole.USER })
//   role: UserRole;

//   @Prop()
//   profileImageUrl?: string;

//   @Prop()
//   bio?: string;

//   @Prop({ default: true })
//   isActive: boolean;

//   @Prop()
//   lastLogin?: Date;

//   // Method to check if password is valid
//   async comparePassword(password: string): Promise<boolean> {
//     return bcrypt.compare(password, this.password);
//   }
// }

// export const UserSchema = SchemaFactory.createForClass(User);

// // Hash password before saving
// UserSchema.pre<User>('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error as Error);
//   }
// });