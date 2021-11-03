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
import { CreateMacroDTO } from "./dto/create-macro.dto";
import { UpdateMacroDTO } from "./dto/update-macro.dto";
import { MacroService } from "./macro.service";

@ApiTags("Macros")
@ApiBearerAuth()
@Controller("macros")
export class MacroController {
  constructor(private readonly service: MacroService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getAll(
    @Query() queryParams: QueryParams,
    @GetUser() user
  ): Promise<any> {
    const items = await this.service.getMacros(user.userId, queryParams);
    const count = await this.service.getMacrosCount(user.userId);
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
    @Body() itemData: CreateMacroDTO,
    @GetUser() user
  ): Promise<any> {
    const item = await this.service.newMacro(itemData, user);
    return item;
  }

  @Put("/:id")
  @UseGuards(AuthGuard("jwt"))
  async updateOneById(
    @Param("id") id: string,
    @Body() data: UpdateMacroDTO,
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
