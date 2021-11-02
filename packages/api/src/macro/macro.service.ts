import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/users/interfaces/user.interface";
import { CreateMacroDTO } from "./dto/create-macro.dto";
import { Macro } from "./interface/macro.interface";

@Injectable()
export class MacroService {
  constructor(
    @InjectModel("Macro") private itemModel: Model<Macro>
  ) {}

  async getMacros(createdBy, queryParams): Promise<Macro[]> {
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

    return items;
  }

  async getMacrosCount(createdBy): Promise<number> {
    const count = await this.itemModel
      .find({ createdBy })
      .countDocuments()
      .exec();
    return count;
  }

  async getOne(itemId: string, user: User): Promise<any> {
    const item = await this.itemModel
      .findOne({ _id: itemId, createdBy: user.id })
      .exec();

    return item;
  }

  async newMacro(
    data: CreateMacroDTO,
    user
  ): Promise<any> {
    const item = new this.itemModel({
      ...data,
      createdBy: user.userId,
    });
    return await item.save();
  }

  async updateOne(itemId, data): Promise<any> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId }, data)
      .exec();
    return await item.save();
  }

  async deleteOne(itemId: string, user: User) {
    return this.itemModel.findOneAndDelete({ _id: itemId, user: user.id });
  }

  async updateOneFromUser(itemId, createdBy, data): Promise<any> {
    const item = await this.itemModel
      .findOneAndUpdate({ _id: itemId, createdBy }, data, { new: true })
      .exec();
    if (item) {
      return await item.save();
    } else {
      throw new NotFoundException("Macro not found");
    }
  }

  async deleteOneFromUser(itemId, user): Promise<any> {
    return this.itemModel.findOneAndDelete({ _id: itemId, createdBy: user });
  }

  async getByIdFromUser(createdBy, id): Promise<Macro> {
    const Macro = await this.itemModel
      .findOne({ _id: id, createdBy })
      .exec();
    return Macro;
  }
}
