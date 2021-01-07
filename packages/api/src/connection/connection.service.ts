import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/users/interfaces/user.interface";
import { CreateConnectionDTO } from "./dto/create-connection.dto";
import { Connection } from "./interface/connection.interface";

@Injectable()
export class ConnectionService {
  constructor(
    @InjectModel("Connection") private itemModel: Model<Connection>
  ) {}

  async getConnections(createdBy, queryParams): Promise<Connection[]> {
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

  async getConnectionsCount(createdBy): Promise<number> {
    const count = await this.itemModel
      .find({ createdBy})
      .countDocuments()
      .exec();
    return count;
  }

  async getOne(itemId: string, user: User): Promise<Connection> {
    const item = await this.itemModel
      .findOne({ _id: itemId, user: user.id })
      .exec();
    return item;
  }

  async newConnection(
    workspaceData: CreateConnectionDTO,
    user
  ): Promise<Connection> {
    const item = new this.itemModel({
      ...workspaceData,
      createdBy: user.userId,
    });
    return item.save();
  }

  async updateOne(itemId, data): Promise<Connection> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId }, data)
      .exec();
    return item.save();
  }

  async deleteOne(itemId: string, user: User) {
    return this.itemModel.findOneAndDelete({ _id: itemId, user: user.id });
  }

  async updateOneFromUser(itemId, createdBy, data): Promise<Connection> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, createdBy }, data, { new: true })
      .exec();
    if (item) {
      return item.save();
    } else {
      throw new NotFoundException("Connection not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<Connection> {
    return this.itemModel.findOneAndDelete({ _id: itemId, createdBy: user });
  }

  async getByIdFromUser(createdBy, id): Promise<Model<Connection>> {
    const Connection = await this.itemModel
      .findOne({ _id: id, createdBy })
      .exec();
    return Connection;
  }
}
