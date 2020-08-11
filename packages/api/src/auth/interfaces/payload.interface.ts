import { Document } from 'mongoose';

export interface Payload extends Document {
	readonly username: string;
	readonly sub: string;
}
