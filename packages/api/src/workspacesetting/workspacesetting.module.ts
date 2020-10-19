import { Module } from "@nestjs/common";
import { WorkspaceSettingService } from "./workspacesetting.service";
import { WorkspaceSettingController } from "./workspacesetting.controller";
import { WorkspaceSettingSchemaProvider } from "./schemas/workspacesetting.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [MongooseModule.forFeatureAsync([WorkspaceSettingSchemaProvider])],
  providers: [WorkspaceSettingService],
  controllers: [WorkspaceSettingController],
  exports: [WorkspaceSettingService],
})
export class WorkspaceSettingModule {}
