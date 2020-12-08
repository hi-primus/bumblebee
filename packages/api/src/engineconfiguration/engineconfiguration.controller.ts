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
import { CreateEngineConfigurationDTO } from "./dto/create-engineconfiguration.dto";
import { PreferedEngineConfigurationDTO } from "./dto/prefered-engineconfiguration.dto";
import { UpdateEngineConfigurationDTO } from "./dto/update-engineconfiguration.dto";
import { EngineConfigurationService } from "./engineconfiguration.service";

@ApiTags("EngineConfigurations")
@ApiBearerAuth()
@Controller("engineconfigurations")
export class EngineConfigurationController {
  constructor(private readonly service: EngineConfigurationService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getAll(
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const items = await this.service.getEngineConfigurations(user.userId, queryParams);
    const count = await this.service.getEngineConfigurationsCount(user.userId);
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
    @Body() itemData: CreateEngineConfigurationDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.newEngineConfiguration(itemData, user);
    return item;
  }

  @Put("/preferred")
  @UseGuards(AuthGuard("jwt"))
  async setPrefered(
    @Body() preferedEngineConfigurationDTO: PreferedEngineConfigurationDTO,
    @GetUser() user
  ): Promise<void> {
    await this.service.setPrefered(
      preferedEngineConfigurationDTO.workspaceId,
      user.userId
    );
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(
    @Param("id") id: string,
    @Body() data: UpdateEngineConfigurationDTO,
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
