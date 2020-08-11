import { Document } from 'mongoose';

export interface DataSource extends Document {
	readonly id: string;
	readonly name: string;
	readonly creator: string;
}
