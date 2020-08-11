import { Document } from 'mongoose';

export interface Workspace extends Document {
	readonly id: string;
	readonly name: string;
	readonly profiling: string;
	readonly dataSources: Array<any>;
	readonly slug: string;
	tabs: Array<any>;
}
