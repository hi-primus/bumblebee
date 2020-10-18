import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/auth/dto/get-user.decorator.dto";
import { QueryParams } from "src/users/interfaces/queryParams.interface";
import { ClusterService } from "./cluster.service";
import { CreateClusterDTO } from "./dto/create-cluster.dto";
import { UpdateClusterDTO } from "./dto/update-cluste.dto";

@ApiTags("Clusters")
@Controller("clusters")
export class ClusterController {
  constructor(private readonly service: ClusterService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getAll(
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const items = await this.service.getManyFromUser(user.userId, queryParams);
    const count = await this.service.getManyFromUserCount(
      user.userId,
      queryParams
    );
    return { items, count };
  }

  @Get("/:id")
  @UseGuards(AuthGuard("jwt"))
  async getByIdFromUser(
    @Param("id") id: string,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.getByIdFromUser(user.userId, id);
    return {
      data: {
        item,
      },
    };
  }

  @Post()
  @UseGuards(AuthGuard("jwt"))
  async createItem(
    @Body() itemData: CreateClusterDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.createOne({
      ...itemData,
      creator: user.userId,
    });
    return item;
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(
    @Param("id") id: string,
    @Body() data: UpdateClusterDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.updateOneFromUser(id, user.userId, data);
    return { data: item };
  }

  @Delete("/:id")
  @UseGuards(AuthGuard("jwt"))
  async deleteOneByID(@Param("id") id: string, @GetUser() user): Promise<void> {
    await this.service.deleteOneFromUser(id, user.userId);
    return;
  }
}
