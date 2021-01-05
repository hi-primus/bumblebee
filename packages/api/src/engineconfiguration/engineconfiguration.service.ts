import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/users/interfaces/user.interface";
import { CreateEngineConfigurationDTO } from "./dto/create-engineconfiguration.dto";
import { EngineConfiguration } from "./interface/engineconfiguration.interface";

@Injectable()
export class EngineConfigurationService {
  constructor(
    @InjectModel("EngineConfiguration") private itemModel: Model<EngineConfiguration>
  ) {}

  async getEngineConfigurations(createdBy, queryParams): Promise<EngineConfiguration[]> {
    let query: any = {};
    queryParams?.filters?.split(",").forEach((filter, index) => {
      query[filter] = queryParams?.values?.split(",")[index] || "";
    });
    const items = await this.itemModel
      .find({ createdBy, ...query })
      .sort(queryParams.sort)
      .skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
      .limit(parseInt(queryParams.pageSize))
      .exec();

    return items;
  }

  async getEngineConfigurationsCount(createdBy): Promise<number> {
    const count = await this.itemModel
      .find({ createdBy})
      .countDocuments()
      .exec();
    return count;
  }

  async getOne(itemId: string, user: User): Promise<EngineConfiguration> {
    const item = await this.itemModel
      .findOne({ _id: itemId, user: user.id })
      .exec();
    return item;
  }

  async newEngineConfiguration(
    workspaceData: CreateEngineConfigurationDTO,
    user
  ): Promise<EngineConfiguration> {
    const item = new this.itemModel({
      ...workspaceData,
      createdBy: user.userId,
    });
    return item.save();
  }

  async updateOne(itemId, data): Promise<EngineConfiguration> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId }, data)
      .exec();
    return item.save();
  }

  async deleteOne(itemId: string, user: User) {
    return this.itemModel.findOneAndDelete({ _id: itemId, user: user.id });
  }

  async updateOneFromUser(itemId, createdBy, data): Promise<EngineConfiguration> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, createdBy }, data, { new: true })
      .exec();
    if (item) {
      return item.save();
    } else {
      throw new NotFoundException("EngineConfiguration not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<EngineConfiguration> {
    return this.itemModel.findOneAndDelete({ _id: itemId, createdBy: user });
  }

  async getByIdFromUser(createdBy, id): Promise<Model<EngineConfiguration>> {
    const EngineConfiguration = await this.itemModel
      .findOne({ _id: id, createdBy })
      .exec();
    return EngineConfiguration;
  }

  async setPrefered(EngineConfigurationId: string, userId: string): Promise<void> {
    await this.itemModel
      .updateMany({ createdBy: userId }, { preferred: false })
      .exec();
    await this.itemModel
      .updateOne(
        { _id: EngineConfigurationId, createdBy: userId },
        { preferred: true }
      )
      .exec();
  }

  async getPrefered(userId: string): Promise<Model<EngineConfiguration>> {
    const EngineConfiguration = await this.itemModel
      .findOne({ createdBy: userId, preferred: true })
      .exec();
    return EngineConfiguration;
  }
}
