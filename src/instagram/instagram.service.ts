import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account } from './schemas/account.schema';
import { IgApiClient } from 'instagram-private-api';

@Injectable()
export class InstagramService {
  private clients: Map<string, IgApiClient> = new Map();

  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  private async initializeClient(account: Account): Promise<IgApiClient> {
    console.log(`Initializing client for username: ${account.username}`);
    const ig = new IgApiClient();
    ig.state.generateDevice(account.username);
    try {
      console.log(`Attempting to log in with username: ${account.username}`);
      await ig.account.login(account.username, account.password);
      this.clients.set(account.username, ig);

      account.isLoggedIn = true;
      await account.save();

      console.log(`Successfully logged in as ${account.username}`);
      return ig;
    } catch (error) {
      if (error.name === 'IgCheckpointError') {
        console.log(`Challenge required for ${account.username}. Attempting to solve...`);
        await ig.challenge.auto(true);

        console.log(`Challenge solved. Please verify on your Instagram account.`);
      } else {
        console.error(`Failed to log in ${account.username}:`, error);
        throw new Error('Instagram login failed');
      }
    }
  }


  private async getClient(username: string): Promise<IgApiClient> {
    console.log(`Retrieving client for username: ${username}`);
    if (this.clients.has(username)) {
      console.log(`Client found in memory for username: ${username}`);
      return this.clients.get(username);
    }

    console.log(`Client not found in memory. Looking up username in database: ${username}`);
    const account = await this.accountModel.findOne({ username }).exec();
    if (!account) {
      console.error(`Account ${username} not found.`);
      throw new Error(`Account ${username} not found.`);
    }

    console.log(`Account found in database. Initializing client for username: ${username}`);
    return await this.initializeClient(account);
  }

  public async sendMessage(username: string, userId: string, message: string) {
    console.log(`Preparing to send message from ${username} to ${userId}`);
    const ig = await this.getClient(username);
    console.log(`Sending message from ${username} to ${userId}`);
    const thread = await ig.entity.directThread([userId]);
    await thread.broadcastText(message);
    console.log(`Message sent successfully from ${username} to ${userId}`);
  }

  public async addAccount(username: string, password: string) {
    console.log(`Attempting to add account with username: ${username}`);
    const existingAccount = await this.accountModel
      .findOne({ username })
      .exec();
    if (existingAccount) {
      console.log(`Account with username ${username} already exists.`);
      throw new Error(`Account ${username} already exists.`);
    }

    console.log(`Creating new account entry for username: ${username}`);
    const account = new this.accountModel({
      username,
      password,
      isLoggedIn: false,
    });
    await account.save();
    console.log(`New account added for username: ${username}`);

    try {
      console.log(`Initializing client for newly added account: ${username}`);
      await this.initializeClient(account);
    } catch (error) {
      console.error(`Failed to initialize client for ${username} after adding:`, error);
    }
  }


  public async getUserIdByUsername(username: string): Promise<string> {
    console.log(`Looking up userId for Instagram username: ${username}`);
    const ig = await this.getClient(username);
    console.log(`Attempting to fetch exact user information for: ${username}`);
    const user = await ig.user.searchExact(username);
    if (!user) {
      console.error(`User ${username} not found`);
      throw new Error(`User ${username} not found`);
    }
    console.log(`Successfully found userId for ${username}: ${user.pk}`);
    return user.pk.toString();
  }
}
