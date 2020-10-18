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
import { GetUser } from "./../auth/dto/get-user.decorator.dto";
import { QueryParams } from "./../users/interfaces/queryParams.interface";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ServiceService } from "./service.service";
import { CreateServiceDTO } from "./dto/create-service.dto";
import { UpdateServiceDTO } from "./dto/update-service.dto";

@ApiTags("Services")
@ApiBearerAuth()
@Controller("services")
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

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
    @Body() itemData: CreateServiceDTO,
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
    @Body() data: UpdateServiceDTO,
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
