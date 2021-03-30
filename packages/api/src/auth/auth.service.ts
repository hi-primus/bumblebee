import {
	Injectable,
	UnauthorizedException,
	ForbiddenException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserCredentialsDto } from 'src/users/dto/user-credentials.dto';
import { User } from 'src/users/interfaces/user.interface';
import { Payload } from './interfaces/payload.interface';
import { SignInResponse } from './interfaces/signInResponse.interface';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async signUp(userCredentials: UserCredentialsDto): Promise<User> {
		return this.usersService.newUser(userCredentials);
	}

	async signIn(userCredentials: UserCredentialsDto): Promise<any> {
		const user = await this.usersService.findOne(userCredentials.username);
		if (
			user &&
			user.active &&
			(await user.comparePassword(userCredentials.password))
		) {
			const payload = { username: user.username, sub: user.id };
			return {
				accessToken: this.jwtService.sign(payload, {
					expiresIn: '7D',
				}),
				refreshToken: this.jwtService.sign(payload, { expiresIn: '30D' }),
			};
		} else if (
			user &&
			(await user.comparePassword(userCredentials.password)) &&
			!user.active
		) {
			throw new ForbiddenException();
		} else {
			throw new UnauthorizedException();
		}
	}

	async profile(userCredentials: User): Promise<any> {
		const user = await this.usersService.findOne(userCredentials.username);
		if (user) {
			const returnUser = {
				id: user.id,
				role: user.role,
				username: user.username,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				fullName: `${user.firstName} ${user.lastName}`,
				active: user.active,
			};
			return returnUser;
		} else {
			throw new UnauthorizedException();
		}
	}

  async verifyUser(bearerToken: string): Promise<any> {

    const decoded = this.jwtService.verify(bearerToken, {
      ignoreExpiration: false
    }) as any;

    const user = await this.usersService.findOne(decoded.username);

		if (user) {
			const returnUser = {
				id: user.id,
				role: user.role,
				username: user.username,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				fullName: `${user.firstName} ${user.lastName}`,
				active: user.active,
			};
			return returnUser;
		} else {
			throw new UnauthorizedException();
		}
	}

	// async refreshToken(token: string): Promise<any> {}
}
