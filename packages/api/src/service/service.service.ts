import { Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Service } from "./interface/service.interface";

@Injectable()
export class ServiceService {
  constructor(@InjectModel("Service") private itemModel: Model<Service>) {}

  async getMany(queryParams): Promise<Service[]> {
    const items = await this.itemModel.find({ queryParams }).exec();
    return items;
  }

  async getManyCount(queryParams): Promise<number> {
    const count = await this.itemModel
      .find({ queryParams })
      .countDocuments()
      .exec();
    return count;
  }

  async getOne(params): Promise<Service> {
    const item = await this.itemModel.findOne(params).exec();
    return item;
  }

  async createOne(newModel): Promise<Service> {
    const item = new this.itemModel(newModel);
    return item.save();
  }

  async updateOne(itemId, data): Promise<Service> {
    const item = await this.itemModel.findOneAndUpdate(itemId, data).exec();
    return item.save();
  }

  async deleteOne(itemId) {
    return this.itemModel.findOneAndDelete({ _id: itemId });
  }

  async updateOneFromUser(itemId, creator, data): Promise<Service> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, creator }, data, { new: true })
      .exec();
    if (item) {
      return item.save();
    } else {
      throw new NotFoundException("Service not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<Service> {
    return this.itemModel.findOneAndDelete({ _id: itemId, creator: user });
  }

  async getManyFromUser(creator, queryParams) {
    const items = await this.itemModel.find({ creator, ...queryParams }).exec();
    return items;
  }

  async getManyFromUserCount(creator, queryParams) {
    const count = await this.itemModel
      .find({ creator, ...queryParams })
      .countDocuments()
      .exec();
    return count;
  }

  async getByIdFromUser(creator, id) {
    const count = await this.itemModel.findOne({ _id: id, creator }).exec();
    return count;
  }
}
