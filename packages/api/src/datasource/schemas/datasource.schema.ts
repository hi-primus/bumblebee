import * as mongoose from 'mongoose';

export const DataSourceSchema = new mongoose.Schema(
	{
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
			required: true,
		},
		name: {
			type: String,
			trim: true,
			required: true,
			minlength: 4,
		},
		url: {
			type: String,
		},
	},
	{ timestamps: true },
);
