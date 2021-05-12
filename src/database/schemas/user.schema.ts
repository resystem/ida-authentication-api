import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

interface Email {
  address: string;
  confirmation_code: string;
  valid: boolean;
}

interface Phone {
  number: number;
  area_code: number;
  confirmation_code: string;
  valid: boolean;
}

interface ResetedPassword {
  password: string;
  date: Date;
  used_token: string;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ active: true })
  active: boolean;

  @Prop({
    type: {
      address: { type: String, default: null, lowercase: true },
      valid: { type: Boolean, default: false },
      confirmation_code: { type: String, default: null },
    },
  })
  email: Email;

  @Prop({
    type: {
      number: { type: Number, default: null, lowercase: true },
      area_code: { type: Number, default: null },
      valid: { type: Boolean, default: false },
      confirmation_code: { type: String, default: null },
    },
  })
  phone: Phone;

  @Prop({
    type: [
      {
        password: { type: String, required: true },
        date: { type: Date, required: true, default: Date.now() },
        used_token: { type: String, required: true },
      },
    ],
  })
  reseted_passwords: ResetedPassword;

  @Prop({ default: Date.now() })
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
