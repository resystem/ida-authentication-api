import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppDocument = App & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class App {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  key: string;

  @Prop()
  image_uri: string;

  @Prop()
  description: string;
}

export const AppSchema = SchemaFactory.createForClass(App);
