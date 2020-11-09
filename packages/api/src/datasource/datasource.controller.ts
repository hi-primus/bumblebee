import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { GetUser } from "./../auth/dto/get-user.decorator.dto";
import { User } from "./../users/interfaces/user.interface";
import { DatasourceService } from "./datasource.service";
import { CreateDataSourceDto } from "./dto/create-DataSource.dto";
import { EditDataSourceDto } from "./dto/edit-DataSource.dto";
import { DataSource } from "./interfaces/datasoruce.interface";
import { editFileName } from "./utils/file-upload";
import fs = require("fs");

@ApiTags("Data Sources")
@ApiBearerAuth()
@Controller("datasource")
export class DatasourceController {
  private logger = new Logger("DataSource");
  constructor(private readonly dataSourceService: DatasourceService) {}

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getDataSources(): Promise<DataSource[]> {
    return this.dataSourceService.getDataSources();
  }
  @Get()
  @UseGuards(AuthGuard("jwt"))
  async getDataSource(@Param("id") id: string): Promise<DataSource> {
    return this.dataSourceService.findOne(id);
  }

  // @Post()
  // @UseGuards(AuthGuard('jwt'))
  // async postDataSource(
  // 	@Body() createDataSourceDto: CreateDataSourceDto,
  // 	@GetUser() user: User,
  // ): Promise<DataSource> {
  // 	this.logger.verbose('DataSource created');
  // 	return this.dataSourceService.newDataSource(createDataSourceDto, user);
  // }

  @Post("/upload")
  @UseGuards(AuthGuard("jwt"))
  async getPresignedUrl(
    @Body() dataSource: CreateDataSourceDto,
    @GetUser() user: User
  ): Promise<any> {
    const presignedUrl = await this.dataSourceService.getPresignedUrl(
      user,
      dataSource
    );
    return { url: presignedUrl };
  }

  @Put("/local/:fileName")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./assets",
        filename: editFileName,
      }),
    })
  )
  async localFileUpload(
    @UploadedFile() file,
    @Param("fileName") fileName: string
  ): Promise<any> {
    console.log(fileName);
    if (
      !process.env.DO_BUCKET &&
      process.env.INSTANCE === "LOCAL" &&
      process.env.BACKEND_URL
    ) {
      return { status: "File Uploaded Successfully" };
    } else {
      throw new NotFoundException();
    }
  }

  @Get("/upload/:filename")
  getLocalFiles(@Param("filename") filename: string, @Res() res) {
    const buffer = fs.readFileSync(`src/../assets/${filename}`);

    res.set({
      "Content-Type": `application/${
        filename.split(".")[filename.split(".").length - 1]
      }`,
      "Content-Disposition": `attachment; ${filename}`,
      "Content-Length": buffer.length,
    });

    res.end(buffer);
  }

  @Put()
  @UseGuards(AuthGuard("jwt"))
  async updateDataSource(
    @Param("id") id: string,
    @Body() dataSourceUpdateDto: EditDataSourceDto
  ): Promise<DataSource> {
    this.logger.verbose("DataSource updated");
    return this.dataSourceService.updateDataSource(id, dataSourceUpdateDto);
  }

  @Delete()
  @UseGuards(AuthGuard("jwt"))
  async deleteDataSource(@Param("id") id: string): Promise<void> {
    return this.dataSourceService.deleteDataSource(id);
  }
}
