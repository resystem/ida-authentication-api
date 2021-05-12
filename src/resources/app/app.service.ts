import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { App, AppDocument } from 'src/database/schemas/app.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(App.name) private app: Model<AppDocument>) {}

  /**
   * create on mongodb a new application with a token
   * @param {App} data validated information to save on database
   * @returns {Promise} promise that resolve on a new application
   */
  async create(data: App): Promise<App> {
    const app = new this.app(data);
    return app.save();
  }

  /**
   * verify if is a valid application by id and app key
   * @param {string} id application id
   * @param {string} key application key
   * @returns {Promise} promise that resolve on a verified application
   */
  async verify(id: string, key: string): Promise<App> {
    return this.app.findOne({ _id: id, key });
  }
}
