import { Model } from 'mongoose';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCredentialsDto } from './dto/user-credentials.dto';

@Injectable()
export class UsersService {
	constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

	async findOne(userOrEmail: string): Promise<User> {
		const user = await this.userModel.findOne({ username: userOrEmail }).exec();
		return user;
	}

	async signUp(createUser: CreateUserDto): Promise<User> {
		const user = new this.userModel(createUser);
		return user.save();
	}

	async newUser(userCredentials: UserCredentialsDto): Promise<User> {
		const user = new this.userModel(userCredentials);
		return user.save();
	}

	async getUsers(queryParams, user): Promise<User[]> {
		if ( ['5f1a0af502f37c097f19ca4a', '5ed5559c1ce6121884455241', '5f2b227fcc7fec606debb7bd'].includes(user.userId) ) {
			const query = {};
			queryParams?.filters?.split(',').forEach((filter, index) => {
				query[filter] = queryParams?.values?.split(',')[index];
			});
			const users = this.userModel
				.find({ ...query })
				.sort(queryParams.sort)
				.skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
				.limit(parseInt(queryParams.pageSize))
				.exec();
			return users;
		} else {
			const query = {};
			queryParams?.filters?.split(',').forEach((filter, index) => {
				query[filter] = queryParams?.values?.split(',')[index];
			});
			const users = this.userModel
				.find({ ...query, _id: user.userId })
				.sort(queryParams.sort)
				.skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
				.limit(parseInt(queryParams.pageSize))
				.exec();
			return users;
		}
	}

	async getUsersCount(user): Promise<any> {
		if ( ['5f1a0af502f37c097f19ca4a', '5ed5559c1ce6121884455241', '5f2b227fcc7fec606debb7bd'].includes(user.userId) ) {
			const count = this.userModel.countDocuments({}).exec();
			return count;
		} else {
			const count = this.userModel.countDocuments({ _id: user.userId }).exec();
			return count;
		}
	}

	async activateUser(usersToActivate): Promise<User[]> {
		if (
			usersToActivate?.users?.split(',').filter((user) => {
				return user;
			}).length > 0
		) {
			const users = this.userModel
				.updateMany(
					{
						$or: usersToActivate?.users
							?.split(',')
							.filter((user) => {
								return user;
							})
							.map((user) => {
								return { _id: user || '' };
							}),
					},
					{ active: true },
					{ new: true, lean: true },
				)
				.exec();
			return users;
		} else {
			throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
		}
	}

	async deactivateUser(usersToActivate): Promise<User[]> {
		if (
			usersToActivate?.users?.split(',').filter((user) => {
				return user;
			}).length > 0
		) {
			const users = this.userModel
				.updateMany(
					{
						$or: usersToActivate?.users
							?.split(',')
							.filter((user) => {
								return user;
							})
							.map((user) => {
								return { _id: user || '' };
							}),
					},
					{ active: false },
					{ new: true, lean: true },
				)
				.exec();
			return users;
		} else {
			throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
		}
	}

	async deleteUser(id: string): Promise<User> {
		return this.userModel.findOneAndDelete({ _id: id });
	}
}
