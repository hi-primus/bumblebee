import { Module } from "@nestjs/common";
import { EngineConfigurationService } from "./engineconfiguration.service";
import { EngineConfigurationController } from "./engineconfiguration.controller";
import { EngineConfigurationSchemaProvider } from "./schemas/engineconfiguration.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [MongooseModule.forFeatureAsync([EngineConfigurationSchemaProvider])],
  providers: [EngineConfigurationService],
  controllers: [EngineConfigurationController],
  exports: [EngineConfigurationService],
})
export class EngineConfigurationModule {}
