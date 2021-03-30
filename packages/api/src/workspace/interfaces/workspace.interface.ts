import { Document } from 'mongoose';

export interface Workspace extends Document {
	readonly id: string;
	readonly name: string;
	readonly profiling: string;
	readonly dataSources: Array<any>;
	readonly commands: Array<any>;
	readonly slug: string;
	readonly configuration: string;
	tabs: Array<any>;
}
