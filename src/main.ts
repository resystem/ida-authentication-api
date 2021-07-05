import { NestFactory } from '@nestjs/core';
import { ServerModule } from './server.module';

const bootstrap = async () => {
  const server = await NestFactory.create(ServerModule);
  server.enableCors({
    origin: (origin, callback) => {
      console.log('🚀 ~ origin', origin);
      callback(null, true)
    },
  });
  await server.listen(3000);
};

bootstrap();
