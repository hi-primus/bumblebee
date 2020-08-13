import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CronService } from "./cron.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DatasourceModule } from "./datasource/datasource.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { AppGateway } from "./app.gateway";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_URL, {
      useUnifiedTopology: true,
      useCreateIndex: true,
      useNewUrlParser: true,
    }),
    AuthModule,
    UsersModule,
    WorkspaceModule,
    DatasourceModule,
  ],
  controllers: [AppController],
  providers: [AppService, CronService, AppGateway],
})
export class AppModule {}
