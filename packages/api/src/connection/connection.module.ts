import { Module } from "@nestjs/common";
import { ConnectionService } from "./connection.service";
import { ConnectionController } from "./connection.controller";
import { ConnectionSchemaProvider } from "./schemas/connection.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [MongooseModule.forFeatureAsync([ConnectionSchemaProvider])],
  providers: [ConnectionService],
  controllers: [ConnectionController],
  exports: [ConnectionService],
})
export class ConnectionModule {}
