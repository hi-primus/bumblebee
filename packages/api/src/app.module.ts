import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatasourceModule } from './datasource/datasource.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { AppGateway } from './app.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRoot(
			'mongodb+srv://bumblebee:6oF5B3omteLRPOQl@cluster0-9mqzj.mongodb.net/bumblebee?retryWrites=true&w=majority',
			{
				useUnifiedTopology: true,
				useCreateIndex: true,
				useNewUrlParser: true,
			},
		),
		AuthModule,
		UsersModule,
		WorkspaceModule,
		DatasourceModule,
	],
	controllers: [AppController],
	providers: [AppService, AppGateway],
})
export class AppModule {}
