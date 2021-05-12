import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { App } from 'src/database/schemas/app.schema';
import { generateKey } from 'src/utils/generate.util';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/app')
  /**
   * it receives a post request to call the create app service function
   * @param {Response} response response data
   * @param {object} body request body
   * @param {string} body.name new application name
   * @returns {Promise} promise contains a new application
   */
  async create(@Res() res, @Body() { name }) {
    const app = new App();

    app.name = name;
    app.key = generateKey();

    let promise;

    try {
      promise = await this.appService.create(app);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status and created application
    res.status(HttpStatus.CREATED).json(promise);
  }

  @Post('/app/verify')
  /**
   * it receives a post request to call the create app service function
   * @param {Response} response response data
   * @param {object} body request body
   * @param {string} body.name new application name
   * @returns {Promise} promise contains a new application
   */
  async verify(@Res() res, @Body() { id, key }) {
    let promise;

    try {
      promise = await this.appService.verify(id, key);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // verify if it founds an app, if not it sends an unathorized error
    if (!promise) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // send success status and found application
    res.status(HttpStatus.ACCEPTED).json(promise);
  }
}
