import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Follow extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  follower: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Person', required: true })
  following: Types.ObjectId;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
