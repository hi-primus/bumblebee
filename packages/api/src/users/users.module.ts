import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchemaProvider } from './schemas/user.schema';
import { UsersController } from './users.controller';

@Module({
	imports: [MongooseModule.forFeatureAsync([UserSchemaProvider])],
	providers: [UsersService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
