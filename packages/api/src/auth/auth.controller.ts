import {
	Controller,
	Post,
	Body,
	ValidationPipe,
	Get,
	UseGuards,
	HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserCredentialsDto } from 'src/users/dto/user-credentials.dto';
import { User } from 'src/users/interfaces/user.interface';
import { SignInResponse } from './interfaces/signInResponse.interface';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './dto/get-user.decorator.dto';
import {
	ApiTags,
	ApiOkResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get('/profile')
	@UseGuards(AuthGuard('jwt'))
	profile(@GetUser() user: User): Promise<User> {
		return this.authService.profile(user);
	}

	@Post('/signup')
	@ApiOkResponse({ description: 'User SignUp' })
	@ApiUnauthorizedResponse({ description: 'Invalid data' })
	signUp(@Body() userCredentials: UserCredentialsDto): Promise<User> {
		userCredentials.active = !process.env.USER_ACTIVATION;
		return this.authService.signUp(userCredentials);
	}

	@Post('/signin')
	@ApiOkResponse({ description: 'User Signin' })
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	@HttpCode(200)
	signIn(@Body() userCredentials: UserCredentialsDto): Promise<SignInResponse> {
		return this.authService.signIn(userCredentials);
	}

	// @Post('/refresh_token')
	// @HttpCode(200)
	// refreshToken(
	// 	@Body(ValidationPipe) userCredentials: UserCredentialsDto,
	// ): Promise<SignInResponse> {
	// 	return this.authService.refreshToken(token);
	// }
}
