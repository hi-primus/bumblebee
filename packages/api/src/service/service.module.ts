import { Module } from "@nestjs/common";
import { ServiceService } from "./service.service";
import { ServiceController } from "./service.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ServiceSchemaProvider } from "./schemas/service.schema";

@Module({
  imports: [MongooseModule.forFeatureAsync([ServiceSchemaProvider])],
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
