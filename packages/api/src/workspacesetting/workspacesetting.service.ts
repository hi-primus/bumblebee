import { Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { User } from 'src/users/interfaces/user.interface';
import { WorkspaceSetting } from "./interface/workspacesetting.interface";
import { CreateWorkspaceSettingDTO } from './dto/create-workspacesetting.dto';

@Injectable()
export class WorkspaceSettingService {
  constructor(@InjectModel("WorkspaceSetting") private itemModel: Model<WorkspaceSetting>) {}

  async getMany(user, queryParams): Promise<WorkspaceSetting[]> {
    const query = {};
		queryParams?.filters?.split(',').forEach((filter, index) => {
			query[filter] = queryParams?.values?.split(',')[index] || '';
		});
    const items = await this.itemModel
      .find({
        ...query,
        createdBy: user.userId,
      })
      .sort(queryParams.sort)
      .skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
      .limit(parseInt(queryParams.pageSize))
      .exec();

    return items;
  }

  async getManyCount(user): Promise<number> {
    const count = await this.itemModel
      .countDocuments({
        createdBy: user.userId,
      })
      .exec();
    return count;
  }

  async getOne(itemId: string, user: User): Promise<WorkspaceSetting> {
    const item = await this.itemModel
			.findOne({ _id: itemId, user: user.id })
			.exec();
		return item;
  }

  async newWorkspaceSetting(
		workspaceData: CreateWorkspaceSettingDTO,
		user,
	): Promise<WorkspaceSetting> {
		const item = new this.itemModel({
			...workspaceData,
			createdBy: user.userId,
		});
		return item.save();
	}

  async updateOne(itemId, data): Promise<WorkspaceSetting> {
    const item = await this.itemModel.findOneAndUpdate({ _id: itemId }, data).exec();
    return item.save();
  }

  async deleteOne(itemId: string, user: User) {
    return this.itemModel.findOneAndDelete({ _id: itemId, user: user.id });
  }

  async updateOneFromUser(itemId, createdBy, data): Promise<WorkspaceSetting> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, createdBy }, data, { new: true })
      .exec();
    if (item) {
      return item.save();
    } else {
      throw new NotFoundException("WorkspaceSetting not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<WorkspaceSetting> {
    return this.itemModel.findOneAndDelete({ _id: itemId, createdBy: user });
  }

  async getManyFromUser(createdBy, queryParams) {
    const items = await this.itemModel.find({ createdBy, ...queryParams }).exec();
    return items;
  }

  async getManyFromUserCount(createdBy, queryParams) {
    const count = await this.itemModel
      .find({ createdBy, ...queryParams })
      .countDocuments()
      .exec();
    return count;
  }

  async getByIdFromUser(createdBy, id) {
    const count = await this.itemModel.findOne({ _id: id, createdBy }).exec();
    return count;
  }
}
