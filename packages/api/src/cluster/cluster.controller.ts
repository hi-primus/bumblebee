import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/auth/dto/get-user.decorator.dto";
import { QueryParams } from "src/users/interfaces/queryParams.interface";
import { ClusterService } from "./cluster.service";

@ApiTags("Clusters")
@Controller("cluster")
export class ClusterController {
  constructor(private readonly service: ClusterService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getAll(
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const items = await this.service.getMany(queryParams);
    const count = await this.service.getManyCount(queryParams);
    return { items, count };
  }

  @Get("/:id")
  @UseGuards(AuthGuard("jwt"))
  async getById(
    @Param("id") id: string,
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.getOne(id);
    return {
      data: {
        item,
      },
    };
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(@Param("id") id: string, @Body() data): Promise<any> {
    const item = await this.service.udpateOne(id, data);
    return { data: item };
  }

  @Delete("/:id")
  @UseGuards(AuthGuard("jwt"))
  async deleteOneByID(@Param("id") id: string): Promise<void> {
    await this.service.deleteOne(id);
    return;
  }
}
