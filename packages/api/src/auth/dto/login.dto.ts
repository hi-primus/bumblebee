import { IsEmail, IsNotEmpty, isEmail } from 'class-validator';

export class LoginDto {
	@IsEmail()
	email: string;

	@IsNotEmpty()
	password: string;
}
