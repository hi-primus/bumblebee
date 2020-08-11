import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
	Controller,
	Logger,
	Get,
	UseGuards,
	Post,
	Delete,
	Body,
	Put,
	Param,
} from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { GetUser } from 'src/auth/dto/get-user.decorator.dto';
import { User } from 'src/users/interfaces/user.interface';
import { DataSource } from './interfaces/datasoruce.interface';
import { CreateDataSourceDto } from './dto/create-DataSource.dto';
import { EditDataSourceDto } from './dto/edit-DataSource.dto';

@ApiTags('Data Sources')
@Controller('datasource')
export class DatasourceController {
	private logger = new Logger('DataSource');
	constructor(private readonly dataSourceService: DatasourceService) {}

	@Get()
	@UseGuards(AuthGuard('jwt'))
	async getDataSources(): Promise<DataSource[]> {
		return this.dataSourceService.getDataSources();
	}
	@Get()
	@UseGuards(AuthGuard('jwt'))
	async getDataSource(@Param('id') id: string): Promise<DataSource> {
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

	@Post('/upload')
	@UseGuards(AuthGuard('jwt'))
	async getPresignedUrl(
		@Body() dataSource: CreateDataSourceDto,
		@GetUser() user: User,
	): Promise<any> {
		const presignedUrl = await this.dataSourceService.getPresignedUrl(
			user,
			dataSource,
		);
		return { url: presignedUrl };
	}

	@Put()
	@UseGuards(AuthGuard('jwt'))
	async updateDataSource(
		@Param('id') id: string,
		@Body() dataSourceUpdateDto: EditDataSourceDto,
	): Promise<DataSource> {
		this.logger.verbose('DataSource updated');
		return this.dataSourceService.updateDataSource(id, dataSourceUpdateDto);
	}

	@Delete()
	@UseGuards(AuthGuard('jwt'))
	async deleteDataSource(@Param('id') id: string): Promise<void> {
		return this.dataSourceService.deleteDataSource(id);
	}
}
