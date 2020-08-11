import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatasourceController } from './datasource.controller';
import { DatasourceService } from './datasource.service';
import { DataSourceSchema } from './schemas/datasource.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'DataSource', schema: DataSourceSchema },
		]),
	],
	controllers: [DatasourceController],
	providers: [DatasourceService],
})
export class DatasourceModule {}
