import { Module } from "@nestjs/common";
import { ClusterService } from "./cluster.service";
import { ClusterController } from "./cluster.controller";
import { ClusterSchemaProvider } from "./schemas/cluster.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [MongooseModule.forFeatureAsync([ClusterSchemaProvider])],
  providers: [ClusterService],
  controllers: [ClusterController],
  exports: [ClusterService],
})
export class ClusterModule {}
