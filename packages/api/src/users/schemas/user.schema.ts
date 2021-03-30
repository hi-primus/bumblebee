// const bcrypt = require('bcrypt');
import { Model, Schema } from 'mongoose';
import * as argon2 from 'argon2';

export const UserSchemaProvider = {
	name: 'User',
	useFactory: (): Schema => {
		const UserSchema = new Schema(
			{
				username: {
					type: String,
					unique: true,
					required: true,
					trim: true,
					minlength: 4,
				},
				active: { type: Boolean, default: false },
				password: { type: String },
				email: {
					type: String,
					unique: true,
					trim: true,
					lowercase: true,
					match: /^\S+@\S+\.\S+$/,
				},
				firstName: {
					type: String,
					required: true,
					trim: true,
					minlength: 3,
				},
				lastName: {
					type: String,
					required: true,
					trim: true,
					minlength: 4,
				},
				workspaces: [
					{
						type: Schema.Types.ObjectId,
						ref: 'Workspace',
						default: null,
					},
				],
				engineconfigurations: [
					{
						type: Schema.Types.ObjectId,
						ref: 'EngineConfigurations',
						default: null,
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
			{ timestamps: true },
		);

		UserSchema.pre('save', function (next: Function) {
			if ((this.isModified('password'), this.isNew)) {
				argon2.hash(this.get('password')).then((hash) => {
					this.set('password', hash);
					next();
				});
			} else {
				return next();
			}
		});

		UserSchema.methods.comparePassword = async function (
			candidatePassword: string,
		): Promise<boolean> {
			try {
				return await argon2.verify(this.get('password'), candidatePassword);
			} catch (e) {
				return false;
			}
		};

		return UserSchema;
	},
};
