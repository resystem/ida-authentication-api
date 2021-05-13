import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';
import { AppModule } from './resources/app/app.module';
import { UserModule } from './resources/user/user.module';

config();
const DATABASE_URL = process.env.DATABASE_URL
  ? `mongodb+srv://${process.env.DATABASE_URL}`
  : 'mongodb://localhost/ida';

@Module({
  imports: [MongooseModule.forRoot(DATABASE_URL), AppModule, UserModule],
})
export class ServerModule {}
