import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InstagramService } from './instagram/instagram.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Controller()
export class AppController {
  constructor(private readonly instagramService: InstagramService) {}

  @Post('add-account')
  async addAccount(@Body() body: { username: string; password: string }) {
    await this.instagramService.addAccount(body.username, body.password);
    return { status: 'Account added successfully' };
  }

  @Get('send-message')
  async sendMessage(
    @Query('username') username: string,
    @Query('userId') userId: string,
    @Query('message') message: string,
  ) {
    await this.instagramService.sendMessage(username, userId, message);
    return { status: 'Message sent' };
  }

  @Get('get-user-id')
  async getUserId(@Query('username') username: string) {
    const userId = await this.instagramService.getUserIdByUsername(username);
    return { userId };
  }
}
