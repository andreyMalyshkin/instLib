import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstagramModule } from './instagram/instagram.modules';
import { AppController } from './app.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    InstagramModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
