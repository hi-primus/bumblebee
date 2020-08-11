import { Document } from 'mongoose';

export interface SignInResponse extends Document {
	readonly accessToken: string;
	readonly refreshToken: string;
}
