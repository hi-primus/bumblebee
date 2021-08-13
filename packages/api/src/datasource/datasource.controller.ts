import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { GetUser } from "./../auth/dto/get-user.decorator.dto";
import { User } from "./../users/interfaces/user.interface";
import { DatasourceService } from "./datasource.service";
import { CreateDataSourceDto } from "./dto/create-DataSource.dto";
import { EditDataSourceDto } from "./dto/edit-DataSource.dto";
import { DataSource } from "./interfaces/datasoruce.interface";
import { editFileName, fileFilter } from "./utils/file-upload";
import { Express } from 'express';
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

  @Post("/local/:fileName")
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fieldSize: 1024 * 1024 * 1024 * 1
      },
      storage: diskStorage({
        destination: "./assets",
        filename: editFileName,
      }),
      fileFilter,
    })
  )
  async localFileUpload(
    @UploadedFile() file:Express.Multer.File,
    @Param("fileName") fileName: string,
    @Req() req,
  ): Promise<any> {
    if (
      !process.env.DO_BUCKET &&
      process.env.INSTANCE === "LOCAL" &&
      process.env.BACKEND_URL
    ) {
      if (req.fileValidationError) {
        throw new ConflictException(req.fileValidationError)
      }
      if (!file) {
        throw new ConflictException("No file uploaded")
      }
      return { status: "File Uploaded Successfully" };
    } else {
      throw new NotFoundException();
    }
  }

  @Get("/local/:filename")
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
