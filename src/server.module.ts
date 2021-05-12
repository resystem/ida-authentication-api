import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppModule } from './resources/app/app.module';

@Module({
  imports: [AppModule, MongooseModule.forRoot('mongodb://localhost/ida')],
})
export class ServerModule {}
