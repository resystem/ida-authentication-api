import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { App, AppSchema } from 'src/database/schemas/app.schema';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: App.name,
        schema: AppSchema,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
