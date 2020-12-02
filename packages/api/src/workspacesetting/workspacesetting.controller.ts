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
import { WorkspaceSettingService } from "./workspacesetting.service";
import { CreateWorkspaceSettingDTO } from "./dto/create-workspacesetting.dto";
import { UpdateWorkspaceSettingDTO } from "./dto/update-workspacesetting.dto";

@ApiTags("WorkspaceSettings")
@ApiBearerAuth()
@Controller("workspacesettings")
export class WorkspaceSettingController {
  constructor(private readonly service: WorkspaceSettingService) {}

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
    return item
  }

  @Post()
  @UseGuards(AuthGuard("jwt"))
  async createItem(
    @Body() itemData: CreateWorkspaceSettingDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.newWorkspaceSetting(itemData, user);
    return item;
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(
    @Param("id") id: string,
    @Body() data: UpdateWorkspaceSettingDTO,
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
