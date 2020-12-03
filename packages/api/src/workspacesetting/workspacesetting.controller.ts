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
import { CreateWorkspaceSettingDTO } from "./dto/create-workspacesetting.dto";
import { PreferedWorkspaceSettingDTO } from "./dto/prefered-workspacesetting.dto";
import { UpdateWorkspaceSettingDTO } from "./dto/update-workspacesetting.dto";
import { WorkspaceSettingService } from "./workspacesetting.service";

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
    const items = await this.service.getWorkspaceSettings(user.userId, queryParams);
    const count = await this.service.getWorkspaceSettingsCount(user.userId);
    return { items, count };
  }

  @Get("/preferred")
  @UseGuards(AuthGuard("jwt"))
  async getPrefered(@GetUser() user): Promise<any> {
    const item = await this.service.getPrefered(user.userId);
    return item;
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
    @Body() itemData: CreateWorkspaceSettingDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.newWorkspaceSetting(itemData, user);
    return item;
  }

  @Put("/preferred")
  @UseGuards(AuthGuard("jwt"))
  async setPrefered(
    @Body() preferedWorkspaceSettingDTO: PreferedWorkspaceSettingDTO,
    @GetUser() user
  ): Promise<void> {
    await this.service.setPrefered(
      preferedWorkspaceSettingDTO.workspaceId,
      user.userId
    );
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
