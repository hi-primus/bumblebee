import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace } from './interfaces/workspace.interface';
import { QueryParams } from './interfaces/queryParams.interface';
import { User } from 'src/users/interfaces/user.interface';
import { CreateWorkspaceDto } from './dto/create-Workspace.dto';

@Injectable()
export class WorkspaceService {
	constructor(
		@InjectModel('Workspace') private workspaceModel: Model<Workspace>,
	) {}

	async getWorkspaces(user, queryParams): Promise<Workspace[]> {
		let query: any = {};
		queryParams?.filters?.split(',').forEach((filter, index) => {
			query[filter] = queryParams?.values?.split(',')[index] || '';
		});
		const workspaces = await this.workspaceModel
			.find({
				...query,
				createdBy: user.userId,
			})
			.sort(queryParams.sort)
			.skip(parseInt(queryParams.page) * parseInt(queryParams.pageSize))
			.limit(parseInt(queryParams.pageSize))
			.select(
				'title activeKernel dataSources name createdAt updatedAt description dataSourcesCount selectedTab tabs tabCount slug configuration',
			)
			.exec();

		return workspaces;
	}

	async countWorkspaces(user): Promise<Workspace[]> {
		const count = await this.workspaceModel
			.countDocuments({
				createdBy: user.userId,
			})
			.exec();
		return count;
	}

	async findOne(workspaceId: string, user: User): Promise<Workspace> {
		const workspace = await this.workspaceModel
			.findOne({ _id: workspaceId, user: user.id })
			.exec();
		return workspace;
	}

	async findOneBySlug(slug: string, user: User): Promise<Workspace> {
		const workspace = await this.workspaceModel
			.findOne({
				// name: new RegExp(`${slug.split('-').join(' ')}`, 'gi'),
				slug: slug,
				user: user.id,
			})
			.exec();
		return workspace;
	}

	async newWorkspace(
		workspaceData: CreateWorkspaceDto,
		user,
	): Promise<Workspace> {
		const workspace = new this.workspaceModel({
			...workspaceData,
			createdBy: user.userId,
		});
		return workspace.save();
	}

	async updateWorkspace(
		workspaceId: string,
		workspaceUpdateDto: any,
		// WorkspaceUpdateDto
	): Promise<Workspace> {
		const workspace = await this.workspaceModel.findOneAndUpdate(
			{ _id: workspaceId },
			workspaceUpdateDto,
		);

		return workspace;
	}

	async deleteWorkspace(workspaceId: string, user: User): Promise<void> {
		const result = await this.workspaceModel
			.deleteOne({ _id: workspaceId, user: user.id })
			.exec();
	}

	async copyWorkspace(user, workspaceId: string, data: any): Promise<any> {
		const workspaceToCopy = await this.workspaceModel.findById(workspaceId);
		const workspace = new this.workspaceModel({
			...workspaceToCopy,
			commands: workspaceToCopy.commands,
			tabs: workspaceToCopy.tabs,
			...data,
			user: user.userId,
		});
		return workspace.save();
	}
}
