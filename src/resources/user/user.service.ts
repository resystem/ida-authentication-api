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
  async findOneById(text: string): Promise<User> {
    const filter: UserFilter = {};

    // valid if the text is object id
    if (isValidObjectId(text)) {
      filter._id = text;
    } else {
      filter.username = text;
    }

    return this.user
      .findOne({
        $or: [{ _id: text }, { username: text }, { 'email.address': text }],
      })
      .exec();
  }

  /**
   *
   * @param text
   */
  async findOne(filter): Promise<User> {
    return this.user.findOne(filter).exec();
  }

  /**
   * create on mongodb a new user on database
   * @param {User} data validated information to save on database
   * @returns {Promise} promise that resolve on a new user
   */
  async create(data: User): Promise<User> {
    const user = new this.user(data);
    return user.save();
  }

  /**
   * update on mongodb an user by ativist id
   * @param {string} ida user id to be update
   * @param {User} data validated information to updated on database
   */
  async update(ida: string, data: User): Promise<User> {
    return this.user.findOneAndUpdate({ _id: ida }, data, { new: true });
  }
}
