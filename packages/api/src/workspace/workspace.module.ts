import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceSchemaProvider } from './schemas/workspace.schema';
import { WorkspaceController } from './workspace.controller';

@Module({
	imports: [MongooseModule.forFeatureAsync([WorkspaceSchemaProvider])],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
