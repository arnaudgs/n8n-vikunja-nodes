import { INodeProperties } from 'n8n-workflow';
import { FALLBACK_WEBHOOK_EVENTS } from '../helper';
import { paginatedOperation, paginationProperties } from './shared';

export interface WebhookEventOption {
	name: string;
	value: string;
}

/**
 * Static fallback for the events dropdown. The list is loaded from
 * `GET /webhooks/events` at runtime so it follows the connected instance; this
 * copy only matters when that call is not permitted by the token.
 */
export const availableWebhookEvents: WebhookEventOption[] = FALLBACK_WEBHOOK_EVENTS.map((e) => ({
	name: e,
	value: e,
}));

export const webhookProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a webhook',
				action: 'Create a webhook',
				routing: {
					request: {
						method: 'PUT',
						url: '=/projects/{{$parameter.webhookProject}}/webhooks',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a webhook',
				action: 'Delete a webhook',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/projects/{{$parameter.webhookProject}}/webhooks/{{$parameter.webhook}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many webhooks',
				action: 'Get many webhooks',
				routing: {
					request: {
						method: 'GET',
						url: '=/projects/{{$parameter.webhookProject}}/webhooks',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a webhook',
				action: 'Update a webhook',
				routing: {
					request: {
						method: 'POST',
						url: '=/projects/{{$parameter.webhookProject}}/webhooks/{{$parameter.webhook}}',
					},
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Project Title or ID',
		name: 'webhookProject',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a project…',
				typeOptions: {
					searchListMethod: 'searchProjects',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: '1567890',
			},
		],
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getAll', 'create', 'delete', 'update'],
			},
		},
		description: 'The project you want to operate on. Choose from the list, or specify an ID.',
	},
	{
		displayName: 'Webhook ID',
		name: 'webhook',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update', 'delete'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'webhook_id',
			},
		},
		description: 'The webhook you want to operate on. Choose from the list, or specify an ID.',
	},
	{
		displayName: 'Webhook Target URL',
		name: 'webhookTarget',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'target_url',
			},
		},
		default: '',
		required: true,
	},
	{
		displayName: 'Secret',
		name: 'secret',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		description:
			'If provided, webhook requests will be signed using HMAC. Check out the docs about how to use this: https://vikunja.io/docs/webhooks/#signing.',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'secret',
			},
		},
	},
	{
		displayName: 'Event Names or IDs',
		name: 'events',
		type: 'multiOptions',
		default: [],
		description:
			'The webhook events which should fire this webhook target. The list is read from the connected Vikunja instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getWebhookEvents',
		},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'events',
			},
		},
	},
	...paginationProperties('webhook', ['getAll']),
];
