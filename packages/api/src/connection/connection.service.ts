import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/users/interfaces/user.interface";
import { CreateConnectionDTO } from "./dto/create-connection.dto";
import { Connection } from "./interface/connection.interface";
import { objectMapEntries, ALL_DATABASE_TYPES, SOURCE_TYPES_PARAMS } from "bumblebee-utils"

@Injectable()
export class ConnectionService {
  constructor(
    @InjectModel("Connection") private itemModel: Model<Connection>
  ) {}

  private returnConnection(item: Connection, privateValues = false, placeholderValues = false): any {

    if (!item) {
      throw new Error('Connection not found or deleted');
    }

    let configuration = item.configuration;

    if (!privateValues && configuration) {
      configuration = objectMapEntries(configuration, (key, value) => {
        if (SOURCE_TYPES_PARAMS[key]?.private) {
          return placeholderValues ? `<${key}>` : false;
        }
        return value;
      });
    }

    return {
      name: item.name,
      id: item.id,
      isDatabase: item.isDatabase,
      configuration
    };
  }

  private returnConnections(items: Connection[], privateValues = false, placeholderValues = false): any[] {

    let returnItems: any[];

    if (!privateValues) {

      returnItems = items.map(item=>{

        let configuration = item.configuration;

        if (configuration) {
          configuration = objectMapEntries(configuration, (key, value) => {
            if (SOURCE_TYPES_PARAMS[key]?.private) {
              return placeholderValues ? `<${key}>` : false;
            } else {
              return value;
            }
          });
        }

        return {
          name: item.name,
          id: item.id,
          isDatabase: item.isDatabase,
          configuration
        }
      });

    } else {

      returnItems = items.map(item=>({
        name: item.name,
        id: item.id,
        isDatabase: item.isDatabase,
        configuration: item.configuration
      }));

    }

    return returnItems;

  }

  async getConnections(createdBy, queryParams): Promise<Connection[]> {
    let query: any = {};
    queryParams?.filters?.split(",").forEach((filter, index) => {

      if (["true", "false"].includes(queryParams?.values?.split(",")[index])) {
        query[filter] = queryParams?.values?.split(",")[index]=="true";
      } else {
        query[filter] = queryParams?.values?.split(",")[index] || "";
      }

    });
    const items = await this.itemModel
      .find({ createdBy, ...query })
      .sort(queryParams.sort)
      .skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
      .limit(parseInt(queryParams.pageSize))
      .exec();

    return this.returnConnections(items, false, false);
  }

  async getConnectionsCount(createdBy): Promise<number> {
    const count = await this.itemModel
      .find({ createdBy })
      .countDocuments()
      .exec();
    return count;
  }

  async getOne(itemId: string, user: User, allFields = false, placeholderValues = false): Promise<any> {
    const item = await this.itemModel
      .findOne({ _id: itemId, createdBy: user.id })
      .exec();

    return this.returnConnection(item, allFields, placeholderValues);
  }

  async newConnection(
    data: CreateConnectionDTO,
    user
  ): Promise<any> {
    data.isDatabase =  ALL_DATABASE_TYPES.includes(data.configuration.type);
    const item = new this.itemModel({
      ...data,
      createdBy: user.userId,
    });
    return this.returnConnection( await item.save() );
  }

  async updateOne(itemId, data): Promise<any> {
    data.isDatabase =  ALL_DATABASE_TYPES.includes(data.configuration.type);
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId }, data)
      .exec();
    return this.returnConnection( await item.save() );
  }

  async deleteOne(itemId: string, user: User) {
    return this.itemModel.findOneAndDelete({ _id: itemId, user: user.id });
  }

  async updateOneFromUser(itemId, createdBy, data): Promise<any> {
    data.isDatabase =  ALL_DATABASE_TYPES.includes(data.configuration.type);
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, createdBy }, data, { new: true })
      .exec();
    if (item) {
      return this.returnConnection( await item.save() );
    } else {
      throw new NotFoundException("Connection not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<any> {
    return this.itemModel.findOneAndDelete({ _id: itemId, createdBy: user });
  }

  async getByIdFromUser(createdBy, id): Promise<Connection> {
    const Connection = await this.itemModel
      .findOne({ _id: id, createdBy })
      .exec();
    return Connection;
  }
}
