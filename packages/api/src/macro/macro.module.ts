import { Module } from "@nestjs/common";
import { MacroService } from "./macro.service";
import { MacroController } from "./macro.controller";
import { MacroSchemaProvider } from "./schemas/macro.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [MongooseModule.forFeatureAsync([MacroSchemaProvider])],
  providers: [MacroService],
  controllers: [MacroController],
  exports: [MacroService],
})
export class MacroModule {}
