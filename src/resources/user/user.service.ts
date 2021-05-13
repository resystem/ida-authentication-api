import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User, UserDocument } from 'src/database/schemas/user.schema';

interface UserFilter {
  _id?: string;
  username?: string;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private user: Model<UserDocument>) {}

  /**
   *
   * @param text
   */
  async findOne(text: string): Promise<User> {
    const filter: UserFilter = {};

    // valid if the text is object id
    if (isValidObjectId(text)) {
      filter._id = text;
    } else {
      filter.username = text;
    }

    return this.user.findOne(filter).exec();
  }

  /**
   * create on mongodb a new user on database
   * @param {User} data validated information to save on database
   * @returns {Promise} promise that resolve on a new user
   */
  async create(data: User): Promise<User> {
    const user = new this.user(data);
    return await user.save();
  }
}
