import { INodeProperties } from 'n8n-workflow';
import { paginatedOperation, paginationProperties } from './shared';

/**
 * The in-app notification inbox. Useful to drive digests from n8n instead of
 * relying on Vikunja's own reminder emails.
 */
export const notificationProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['notification'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get the notifications of the current user',
				action: 'Get many notifications',
				routing: {
					request: {
						method: 'GET',
						url: '/notifications',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Mark All as Read',
				value: 'markAllAsRead',
				description: 'Mark every notification of the current user as read',
				action: 'Mark all notifications as read',
				routing: {
					request: {
						method: 'POST',
						url: '/notifications',
					},
				},
			},
			{
				name: 'Toggle Read',
				value: 'toggleRead',
				description: 'Mark a single notification as read or unread',
				action: 'Toggle the read state of a notification',
				routing: {
					request: {
						method: 'POST',
						url: '=/notifications/{{$parameter.notificationId}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Notification ID',
		name: 'notificationId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['toggleRead'],
			},
		},
	},
	...paginationProperties('notification', ['getAll']),
];
