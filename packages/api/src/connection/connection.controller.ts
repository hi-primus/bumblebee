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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GetUser } from "./../auth/dto/get-user.decorator.dto";
import { QueryParams } from "./../users/interfaces/queryParams.interface";
import { CreateConnectionDTO } from "./dto/create-connection.dto";
import { UpdateConnectionDTO } from "./dto/update-connection.dto";
import { ConnectionService } from "./connection.service";

@ApiTags("Connections")
@ApiBearerAuth()
@Controller("connections")
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getAll(
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const items = await this.service.getConnections(user.userId, queryParams);
    const count = await this.service.getConnectionsCount(user.userId);
    return { items, count };
  }

  @Get("/:id")
  @UseGuards(AuthGuard("jwt"))
  async getByIdFromUser(
    @Param("id") id: string,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.getByIdFromUser(user.userId, id);
    return item;
  }

  @Post()
  @UseGuards(AuthGuard("jwt"))
  async createItem(
    @Body() itemData: CreateConnectionDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.newConnection(itemData, user);
    return item;
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(
    @Param("id") id: string,
    @Body() data: UpdateConnectionDTO,
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
