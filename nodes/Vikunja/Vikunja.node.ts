import {
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { taskProperties } from './properties/Task';
import { projectProperties } from './properties/Project';
import { labelProperties } from './properties/Label';
import { getWebhookEvents, searchAndMap } from './helper';
import { webhookProperties } from './properties/Webhook';
import { teamProperties } from './properties/Team';
import { userProperties } from './properties/User';
import { savedFilterProperties } from './properties/SavedFilter';
import { notificationProperties } from './properties/Notification';

export class Vikunja implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vikunja',
		name: 'vikunja',
		icon: 'file:vikunja.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: "Get data from Vikunja's API",
		defaults: {
			name: 'Vikunja',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vikunjaApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.apiUrl.replace(new RegExp("/+$"), "")}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Label',
						value: 'label',
					},
					{
						name: 'Notification',
						value: 'notification',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Saved Filter',
						value: 'savedFilter',
					},
					{
						name: 'Task',
						value: 'task',
					},
					{
						name: 'Team',
						value: 'team',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
				],
				default: 'task',
			},

			...taskProperties,
			...projectProperties,
			...labelProperties,
			...webhookProperties,
			...teamProperties,
			...userProperties,
			...savedFilterProperties,
			...notificationProperties,
		],
	};

	methods = {
		listSearch: {
			async searchProjects(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				return searchAndMap(this, '/projects', 'title', filter);
			},
			async searchLabels(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				return searchAndMap(this, '/labels', 'title', filter);
			},
			async searchTeams(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				return searchAndMap(this, '/teams', 'name', filter);
			},
			async searchProjectViews(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
				// Views belong to a project, so which parameter holds it depends on the
				// resource currently selected in the node.
				const projectParameters = ['taskProject', 'project', 'webhookProject'];
				let projectId: string | number | undefined;

				for (const parameter of projectParameters) {
					try {
						const raw = this.getNodeParameter(parameter, 0);
						// Project parameters are resource locators, which resolve to a
						// { mode, value } object rather than to the id itself.
						const value =
							raw !== null && typeof raw === 'object'
								? (raw as { value?: string | number }).value
								: (raw as string | number | undefined);

						if (value !== undefined && value !== null && value !== '') {
							projectId = value;
							break;
						}
					} catch {
						// The parameter does not exist for the current resource.
					}
				}

				if (!projectId) {
					// n8n shows its placeholder text when no option is available.
					return { results: [] };
				}
				return searchAndMap(this, `/projects/${projectId}/views`);
			},
		},
		loadOptions: {
			getWebhookEvents,
		},
	};
}
