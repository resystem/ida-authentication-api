import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
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

  private generateToken(username: string, id: string): string {
    return sign({ username: username, ida: id }, process.env.SECRET, {
      expiresIn: '7d',
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
    let user;

    try {
      // try find an user
      user = await this.userService.findOneById(body.username);
    } catch (err) {
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
    } catch (err) {
      throw 'Internal Server Error';
    }

    try {
      // call service to create a new user
      user = await this.userService.create(body);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status and created application
    return response.status(HttpStatus.CREATED).json({
      ...user.toJSON(),
      token: this.generateToken(user.username, user._id),
    });
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
      user = await this.userService.findOneById(body.username);
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
      token: this.generateToken(user.username, user._id),
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
      token: this.generateToken(user.username, user._id),
    });
  }

  @Post('/user/request-email-validation')
  /**
   * check if user token is valid
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email to be request validate
   * @returns {Promise} contains a new logged user
   */
  async requestEmailValidation(@Res() response, @Body() body) {
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
      user = await this.userService.findOneById(body.email);
    } catch (err) {
      throw 'Internal Server Error';
    }

    if (!user) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'user/user-not-found' });
    }

    const data = new User();
    data.email = {
      address: body.email, // user.email.address,
      valid: false,
      confirmation_code: generateRandomCode(),
    };

    try {
      await this.userService.update(user._id, data);
      await send(data);
    } catch (err) {
      throw 'Internal Server Error';
    }

    // send success status
    return response.status(HttpStatus.OK).json({
      ...user.toJSON(),
    });
  }

  @Post('/user/validate-email')
  /**
   * check if user token is valid
   * @param {Response} response response data
   * @param {object} body user data to be resgister
   * @param {string} body.email user email to be request validate
   * @param {string} body.code enail validation code
   * @returns {Promise} contains a new logged user
   */
  async validateEmail(@Res() response, @Body() body) {
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
      address: body.email, // user.email.address,
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
    });
  }
}
