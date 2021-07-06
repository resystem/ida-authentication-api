import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { hash } from 'src/utils/password.util';
import { generateRandomCode } from 'src/utils/generate.util';
import { UserService } from './user.service';
import { User } from 'src/database/schemas/user.schema';
import { send } from 'src/libs/email.lib';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  private generateToken(email: string, id: string): string {
    console.log('🚀 ~ process.env.SECRET', process.env.SECRET);
    return sign({ email: email, ida: id }, process.env.SECRET, {
      expiresIn: '7d',
    });
  }

  @Get('/user/:id')
  /**
   * it is receive a get user request by id, email or username
   * @param {Response} response response data
   * @param {object} id user reference
   * @returns {Promise} contains a new logged user
   */
  async getUser(@Res() response, @Param('id') id: any) {
    const $or: any = [{ username: id }, { 'email.address': id }];
    if (id.match(/^[0-9a-fA-F]{24}$/)) $or.push({ _id: id });

    let user;

    try {
      user = await this.userService.findOne({ $or });
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'user/not-found' });
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
      password: '',
    });
  }

  @Post('/user/signup')
  /**
   * it receives a post request to call the create user function at service
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @returns {Promise} promise contains a new logged user
   */
  async signup(@Res() response, @Body() body) {
    console.log('🚀 ~ body', body);
    let user;

    try {
      // try find an user
      user = await this.userService.findOneById(body.email);
    } catch (err) {
      console.log(err);
      throw 'Internal Server Error';
    }

    // check is duplicated user
    if (user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'signup/duplicated-user' });
    }

    try {
      // encrypt password
      body.password = await hash(body.password);
      console.log('🚀 ~ body.password', body.password);
    } catch (err) {
      console.log([err]);
      throw 'Internal Server Error';
    }

    try {
      // call service to create a new user
      user = await this.userService.create(body);
      console.log('🚀 ~ user', user);
    } catch (err) {
      console.log('userService.create', [err]);
      throw 'Internal Server Error';
    }

    try {
      // send success status and created application
      return response.status(HttpStatus.CREATED).json({
        ...user.toJSON(),
        password: '',
        token: this.generateToken(user.email, user._id),
      });
    } catch (err) {
      console.log('🚀 ~ err', err);
      throw 'Internal Server Error';
    }

  }

  @Post('/user/signin')
  /**
   * check if user is atu
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @returns {Promise} contains a new logged user
   */
  async signin(@Res() response, @Body() body) {
    let user;

    try {
      user = await this.userService.findOneById(body.email);
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'signin/user-not-found' });
    }

    const match = await compare(body.password, user.password);
    if (!match) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'signin/invalid-password' });
    }

    // send success status and logged user
    return response.status(HttpStatus.CREATED).json({
      ...user.toJSON(),
      password: '',
      token: this.generateToken(user.email, user._id),
    });
  }

  @Post('/user/validate')
  /**
   * check if user token is valid
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @returns {Promise} contains a new logged user
   */
  async validate(@Res() response, @Body() body) {
    let decoded;

    try {
      decoded = await verify(body.token, process.env.SECRET);
    } catch (err) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'signin/invalid-token' });
    }

    let user;

    try {
      user = await this.userService.findOneById(decoded.ida);
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'signin/user-not-found' });
    }

    // send success status and logged user
    return response.status(HttpStatus.CREATED).json({
      ...user.toJSON(),
      password: '',
      token: this.generateToken(user.email, user._id),
    });
  }

  @Post('/user/request-email-confirmation')
  /**
   * request email confirmation
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email to request validation
   * @returns {Promise} contains a new logged user
   */
  async requestEmailConfirmation(@Res() response, @Body() body) {
    console.log('🚀 ~ requestEmailConfirmation');
    const emailExpressionValidator =
      /^[a-z0-9._-]{2,}@[a-z0-9]{2,}\.[a-z0-9]{2,}(\.[a-z0-9]{2,})*?$/;

    // check if has valid email
    const isValidEmail = emailExpressionValidator.test(body.email);
    if (!isValidEmail) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-email' });
    }

    let user;

    try {
      user = await this.userService.findOne({
        'email.address': body.email,
      });
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-code' });
    }

    const data = new User();
    data.email = {
      address: body.email,
      valid: false,
      confirmation_code: generateRandomCode(),
    };

    try {
      await this.userService.update(user._id, data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    try {
      await send(data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
      password: '',
    });
  }

  @Post('/user/validate-email-code')
  /**
   * request email confirmation
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email
   * @param {string} body.code user code to validate
   * @returns {Promise} contains a new logged user
   */
  async validateEmailCode(@Res() response, @Body() body) {
    const emailExpressionValidator =
      /^[a-z0-9._-]{2,}@[a-z0-9]{2,}\.[a-z0-9]{2,}(\.[a-z0-9]{2,})*?$/;

    // check if has valid email
    const isValidEmail = emailExpressionValidator.test(body.email);
    if (!isValidEmail) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-email' });
    }

    let user;

    try {
      user = await this.userService.findOne({
        'email.address': body.email,
        'email.confirmation_code': body.code,
      });
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-code' });
    }

    const data = new User();
    data.email = {
      address: body.email,
      valid: true,
      confirmation_code: null,
    };

    try {
      await this.userService.update(user._id, data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
      password: '',
    });
  }

  @Post('/user/request-reset-password')
  /**
   * check if user token is valid
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email to request validation
   * @returns {Promise} contains a new logged user
   */
  async requestResetPassword(@Res() response, @Body() body) {
    const emailExpressionValidator =
      /^[a-z0-9._-]{2,}@[a-z0-9]{2,}\.[a-z0-9]{2,}(\.[a-z0-9]{2,})*?$/;

    // check if has valid email
    const isValidEmail = emailExpressionValidator.test(body.email);
    if (!isValidEmail) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-email' });
    }

    let user;

    try {
      user = await this.userService.findOne({
        'email.address': body.email,
      });
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-code' });
    }

    const data = new User();
    data.email = {
      address: body.email,
      valid: user.email.valid,
      confirmation_code: generateRandomCode(),
    };

    try {
      await this.userService.update(user._id, data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    try {
      await send(data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
      password: '',
    });
  }

  @Post('/user/validate-reset-password-code')
  /**
   * request email confirmation
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email
   * @param {string} body.code user code to validate
   * @returns {Promise} contains a new logged user
   */
  async validateResetPasswordCode(@Res() response, @Body() body) {
    const emailExpressionValidator =
      /^[a-z0-9._-]{2,}@[a-z0-9]{2,}\.[a-z0-9]{2,}(\.[a-z0-9]{2,})*?$/;

    // check if has valid email
    const isValidEmail = emailExpressionValidator.test(body.email);
    if (!isValidEmail) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-email' });
    }

    let user;

    try {
      user = await this.userService.findOne({
        'email.address': body.email,
        'email.confirmation_code': body.code,
      });
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-code' });
    }

    const parsedUSer = user.toJSON();
    delete parsedUSer.password;

    // send success status
    return response.status(HttpStatus.OK).json({
      ...parsedUSer,
    });
  }

  @Post('/user/reset-password')
  /**
   * check if user token is valid
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email to be request validate
   * @param {string} body.code email validation code
   * @param {string} body.password new password
   * @returns {Promise} contains a new logged user
   */
  async resetPassword(@Res() response, @Body() body) {
    const emailExpressionValidator =
      /^[a-z0-9._-]{2,}@[a-z0-9]{2,}\.[a-z0-9]{2,}(\.[a-z0-9]{2,})*?$/;

    // check if has valid email
    const isValidEmail = emailExpressionValidator.test(body.email);
    if (!isValidEmail) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-email' });
    }

    let user;

    try {
      user = await this.userService.findOne({
        'email.address': body.email,
        'email.confirmation_code': body.code,
      });
    } catch (err) {
      throw 'Internal Server Error';
    }
    if (!user) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'user/invalid-code' });
    }

    let password;
    try {
      // encrypt password
      password = await hash(body.password);
    } catch (err) {
      throw 'Internal Server Error';
    }

    const data = new User();
    data.email = {
      address: body.email,
      valid: true,
      confirmation_code: null,
    };
    data.password = password;

    try {
      user = await this.userService.update(user._id, data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
      password: '',
    });
  }
}
