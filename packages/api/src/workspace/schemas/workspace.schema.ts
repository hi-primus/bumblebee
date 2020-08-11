import mongoose, { Model, Schema } from 'mongoose';
import * as slug from 'mongoose-slug-generator';

export const WorkspaceSchemaProvider = {
	name: 'Workspace',
	useFactory: (): Model<any> => {
		const WorkspaceSchema = new Schema(
			{
				name: {
					type: String,
					required: true,
					trim: true,
					minlength: 4,
				},
				slug: {
					type: String,
					slug: 'name',
					unique: true,
				},
				activeKernel: { type: Boolean, default: false },
				createdBy: {
					type: Schema.Types.ObjectId,
					ref: 'User',
					default: null,
				},
				connection: {
					id: { type: String },
					createDate: { type: Date },
				},
				title: { type: String },
				description: { type: String },
				dataSourcesCount: { type: Number, default: 0 },
				commands: [
					{
						type: String,
					},
				],
				selectedTab: { type: Number, default: 0 },
				tabs: [
					{
						name: { type: String },
						profiling: { type: String },
						dataSources: [
							{
								type: Schema.Types.ObjectId,
								ref: 'DataSource',
								default: null,
							},
						],
					},
				],
				dataSources: [
					{
						type: Schema.Types.ObjectId,
						ref: 'DataSource',
						default: null,
					},
				],
			},
			{
				timestamps: true,
				toJSON: {
					virtuals: true,
				},
				toObject: {
					virtuals: true,
				},
			},
		);
		WorkspaceSchema.plugin(slug, { separator: '-', lang: 'en' });
		WorkspaceSchema.pre('save', function (next: Function) {
			this.slug = this.slug.replace(' ', '-');
			next();
		});

		WorkspaceSchema.virtual('tabCount').get(function () {
			return this.tabs?.length || 0;
		});

		return WorkspaceSchema;
	},
};
