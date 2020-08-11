import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserCredentialsDto } from 'src/users/dto/user-credentials.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authService: AuthService) {
		super({
			usernameField: 'email',
			passwordField: 'password',
		});
	}

	async signIn(userCredentials: UserCredentialsDto): Promise<any> {
		const user = await this.authService.signIn(userCredentials);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}
