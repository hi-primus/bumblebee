import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cluster } from "./interface/cluster.interface";

@Injectable()
export class ClusterService {
  constructor(@InjectModel("Cluster") private itemModel: Model<Cluster>) {}

  async getMany(queryParams): Promise<Cluster[]> {
    const items = await this.itemModel.find({ queryParams }).exec();
    return items;
  }

  async getManyCount(queryParams): Promise<number> {
    const count = await this.itemModel.find({ queryParams }).getCount().exec();
    return count;
  }

  async getOne(params): Promise<Cluster> {
    const item = await this.itemModel.findOne(params).exec();
    return item;
  }

  async createOne(newModel): Promise<Cluster> {
    const item = new this.itemModel(newModel);
    return item.save();
  }

  async udpateOne(itemId, data): Promise<Cluster> {
    const item = await this.itemModel.findOneAndUpdate(itemId, data).exec();
    return item.save();
  }

  async deleteOne(itemId) {
    return this.itemModel.findOneAndDelete({ _id: itemId });
  }
}
