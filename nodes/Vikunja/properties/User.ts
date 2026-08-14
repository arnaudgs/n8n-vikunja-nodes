import { INodeProperties } from 'n8n-workflow';

/**
 * Read-only user endpoints. They are what makes assignee handling usable:
 * every assignment route in Vikunja takes a numeric user id or a username, and
 * before this resource existed there was no way to resolve one from n8n.
 */
export const userProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get Current User',
				value: 'getCurrent',
				description: 'Get the user the API token belongs to',
				action: 'Get the current user',
				routing: {
					request: {
						method: 'GET',
						url: '/user',
					},
				},
			},
			{
				name: 'Get Timezones',
				value: 'getTimezones',
				description: 'Get all time zones the Vikunja instance accepts for reminders',
				action: 'Get all timezones',
				routing: {
					request: {
						method: 'GET',
						url: '/user/timezones',
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				description:
					'Search users by name or username. Vikunja only returns users who made themselves discoverable.',
				action: 'Search users',
				routing: {
					request: {
						method: 'GET',
						url: '/users',
					},
				},
			},
		],
		default: 'getCurrent',
	},
	{
		displayName: 'Search',
		name: 'userSearch',
		type: 'string',
		default: '',
		required: true,
		description:
			'The name, username or email to search for. Vikunja requires an exact match on email, and only returns users whose discoverability settings allow it.',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 's',
			},
		},
	},
];
