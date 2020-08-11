import { Document } from 'mongoose';

export interface User extends Document {
	readonly id: string;
	readonly role: string;
	readonly username: string;
	readonly email: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly fullName?: string;
	readonly active: boolean;

	password?: string;
	comparePassword?: (passwordCandidate: string) => boolean;
}
