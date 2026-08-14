import { INodeProperties } from 'n8n-workflow';
import {
	attachmentToBinary,
	mergeExistingTask,
	mergeWithExistingProperty,
	prepareAttachmentUpload,
} from '../helper';
import { paginatedOperation, paginationProperties, taskQueryOptions } from './shared';

/** Operations listing tasks, which share the pagination and query options. */
const TASK_COLLECTION_OPERATIONS = ['getAll', 'getAllAcrossProjects', 'getAllInView'];

/** Operations listing something else than tasks but still paginated. */
const OTHER_COLLECTION_OPERATIONS = ['getAllAssignees', 'getAllAttachments', 'getAllLabelsOnTask'];

export const taskProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
		options: [
			{
				name: 'Add a Comment',
				description: 'Add a comment to a task',
				value: 'addComment',
				action: 'Add a comment',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/comments',
					},
				},
			},
			{
				name: 'Add a Label',
				description: 'Add a label to a task',
				value: 'addLabel',
				action: 'Add a label',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/labels',
					},
				},
			},
			{
				name: 'Add a Reaction',
				description: 'Add a reaction to a task or comment',
				value: 'addReaction',
				action: 'Add a reaction',
				routing: {
					request: {
						method: 'PUT',
						url: '=/{{$parameter.reactionKind}}/{{$parameter.reactionEntityID}}/reactions',
					},
				},
			},
			{
				name: 'Add a Relation',
				description: 'Add a relation to a task',
				value: 'addRelation',
				action: 'Add a relation',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/relations',
					},
				},
			},
			{
				name: 'Assign a User to a Task',
				value: 'assignUser',
				action: 'Assign a user',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/assignees',
					},
				},
			},
			{
				name: 'Assign Multiple Users to a Task',
				description: 'Replace the assignees of a task in a single call',
				value: 'assignUsersBulk',
				action: 'Assign multiple users',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}/assignees/bulk',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a task',
				action: 'Create a task',
				routing: {
					request: {
						method: 'PUT',
						url: '=/projects/{{$parameter.taskProject}}/tasks',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a task',
				action: 'Delete a task',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}',
					},
				},
			},
			{
				name: 'Delete an Attachment',
				value: 'deleteAttachment',
				description: 'Delete an attachment of a task',
				action: 'Delete an attachment',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}/attachments/{{$parameter.attachmentId}}',
					},
				},
			},
			{
				name: 'Delete a Comment',
				description: 'Delete an existing comment on a task',
				value: 'deleteComment',
				action: 'Delete a comment',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}/comments/{{$parameter.commentId}}',
					},
				},
			},
			{
				name: 'Download an Attachment',
				value: 'downloadAttachment',
				description: 'Download an attachment of a task as binary data',
				action: 'Download an attachment',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/attachments/{{$parameter.attachmentId}}',
						encoding: 'arraybuffer',
						json: false,
					},
					output: {
						postReceive: [attachmentToBinary],
					},
				},
			},
			{
				name: 'Duplicate',
				value: 'duplicate',
				description: 'Duplicate a task into a project',
				action: 'Duplicate a task',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/duplicate',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a task',
				action: 'Get a task',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}',
					},
				},
			},
			{
				name: 'Get a Comment',
				value: 'getComment',
				description: 'Get a single comment of a task',
				action: 'Get a comment',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/comments/{{$parameter.commentId}}',
					},
				},
			},
			{
				name: 'Get All Assignees',
				description: 'Fetch all users assigned to a task',
				value: 'getAllAssignees',
				action: 'Get all assignees',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/assignees',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Get All Attachments',
				description: 'Fetch the attachment metadata of a task',
				value: 'getAllAttachments',
				action: 'Get all attachments',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/attachments',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Get All Comments',
				description: 'Fetch all comments on a task',
				value: 'getAllComments',
				action: 'Get all comments',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/comments',
						// This endpoint is not paginated, it only accepts order_by.
						qs: {
							order_by: '={{ $parameter.commentOrder }}',
						},
					},
				},
			},
			{
				name: 'Get All Labels',
				description: 'Fetch all labels on a task',
				value: 'getAllLabelsOnTask',
				action: 'Get all labels',
				routing: {
					request: {
						method: 'GET',
						url: '=/tasks/{{$parameter.taskId}}/labels',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Get All Reactions',
				description: 'Fetch the reactions of a task or comment',
				value: 'getReactions',
				action: 'Get all reactions',
				routing: {
					request: {
						method: 'GET',
						url: '=/{{$parameter.reactionKind}}/{{$parameter.reactionEntityID}}/reactions',
					},
				},
			},
			{
				name: 'Get by Index',
				description:
					'Get a task by the index it has inside its project, as shown in its identifier',
				value: 'getByIndex',
				action: 'Get a task by index',
				routing: {
					request: {
						method: 'GET',
						url: '=/projects/{{$parameter.taskProject}}/tasks/by-index/{{$parameter.taskIndex}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many tasks of a project',
				action: 'Get many tasks',
				routing: {
					request: {
						method: 'GET',
						url: '=/projects/{{$parameter.taskProject}}/tasks',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Get Many Across All Projects',
				value: 'getAllAcrossProjects',
				description: 'Get many tasks from every project the user has access to',
				action: 'Get many tasks across all projects',
				routing: {
					request: {
						method: 'GET',
						url: '/tasks',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Get Many in a View',
				value: 'getAllInView',
				description:
					'Get many tasks as they appear in a project view, honouring the filter and sorting of that view',
				action: 'Get many tasks in a view',
				routing: {
					request: {
						method: 'GET',
						url: '=/projects/{{$parameter.taskProject}}/views/{{$parameter.view}}/tasks',
					},
					...paginatedOperation,
				},
			},
			{
				name: 'Mark as Read',
				value: 'markAsRead',
				description: 'Mark a task as read for the current user',
				action: 'Mark a task as read',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}/read',
					},
				},
			},
			{
				name: 'Move to a Bucket',
				value: 'moveToBucket',
				description: 'Move a task into a kanban bucket of a project view',
				action: 'Move a task to a bucket',
				routing: {
					request: {
						method: 'POST',
						url: '=/projects/{{$parameter.taskProject}}/views/{{$parameter.view}}/buckets/{{$parameter.bucketId}}/tasks',
						body: {
							task_id: '={{ $parameter.taskId }}',
							bucket_id: '={{ $parameter.bucketId }}',
							project_view_id: '={{ $parameter.view }}',
						},
					},
				},
			},
			{
				name: 'Remove a Label From a Task',
				value: 'removeLabel',
				action: 'Remove a label',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}/labels/{{$parameter.taskLabel}}',
					},
				},
			},
			{
				name: 'Remove a Reaction',
				value: 'removeReaction',
				action: 'Remove a reaction',
				description: 'Remove a reaction from a task or comment',
				routing: {
					request: {
						method: 'POST',
						url: '=/{{$parameter.reactionKind}}/{{$parameter.reactionEntityID}}/reactions/delete',
					},
				},
			},
			{
				name: 'Remove a Relation',
				description: 'Remove an existing relation on a task',
				value: 'removeRelation',
				action: 'Remove a relation',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}/relations/{{$parameter.relationKind}}/{{$parameter.otherTaskId}}',
					},
				},
			},
			{
				name: 'Remove an Assigned User From a Task',
				value: 'unassignUser',
				action: 'Unassign a user',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/tasks/{{$parameter.taskId}}/assignees/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'Set Labels',
				value: 'setLabels',
				description: 'Replace all labels of a task in a single call',
				action: 'Set the labels of a task',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}/labels/bulk',
					},
				},
			},
			{
				name: 'Subscribe',
				value: 'subscribe',
				description: 'Subscribe the current user to a task to receive its notifications',
				action: 'Subscribe to a task',
				routing: {
					request: {
						method: 'PUT',
						url: '=/subscriptions/task/{{$parameter.taskId}}',
					},
				},
			},
			{
				name: 'Unsubscribe',
				value: 'unsubscribe',
				description: 'Unsubscribe the current user from a task',
				action: 'Unsubscribe from a task',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/subscriptions/task/{{$parameter.taskId}}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a task',
				action: 'Update a task',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}',
					},
					send: {
						preSend: [mergeExistingTask],
					},
				},
			},
			{
				name: 'Update a Comment',
				description: 'Update an existing comment on a task',
				value: 'updateComment',
				action: 'Update a comment',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}/comments/{{$parameter.commentId}}',
					},
				},
			},
			{
				name: 'Update Many',
				value: 'bulkUpdate',
				description: 'Update the same fields on many tasks at once',
				action: 'Update many tasks',
				routing: {
					request: {
						method: 'POST',
						url: '/tasks/bulk',
						body: {
							// Vikunja only applies the fields listed here, everything else in
							// `values` is ignored — sending the values alone silently resets
							// the omitted fields instead.
							fields: '={{ Object.keys($parameter.bulkFields ?? {}) }}',
						},
					},
				},
			},
			{
				name: 'Update Task Position',
				description: 'Update the position of a task on a view',
				value: 'updateTaskPosition',
				action: 'Update the task position',
				routing: {
					request: {
						method: 'POST',
						url: '=/tasks/{{$parameter.taskId}}/position',
					},
				},
			},
			{
				name: 'Upload an Attachment',
				value: 'uploadAttachment',
				description: 'Upload binary data as an attachment of a task',
				action: 'Upload an attachment',
				routing: {
					request: {
						method: 'PUT',
						url: '=/tasks/{{$parameter.taskId}}/attachments',
					},
					send: {
						preSend: [prepareAttachmentUpload],
					},
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: [
					'addComment',
					'addLabel',
					'addRelation',
					'assignUser',
					'assignUsersBulk',
					'delete',
					'deleteAttachment',
					'deleteComment',
					'downloadAttachment',
					'duplicate',
					'get',
					'getAllAssignees',
					'getAllAttachments',
					'getAllComments',
					'getAllLabelsOnTask',
					'getComment',
					'markAsRead',
					'moveToBucket',
					'removeLabel',
					'removeRelation',
					'setLabels',
					'subscribe',
					'unassignUser',
					'unsubscribe',
					'update',
					'updateComment',
					'updateTaskPosition',
					'uploadAttachment',
				],
			},
		},
	},
	{
		displayName: 'Project Title or ID',
		name: 'taskProject',
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
				resource: ['task'],
				operation: [
					'create',
					'getAll',
					'getAllInView',
					'getByIndex',
					'moveToBucket',
					'updateTaskPosition',
				],
			},
		},
		description: 'The project you want to operate on. Choose from the list, or specify an ID.',
	},
	{
		displayName: 'Task Index',
		name: 'taskIndex',
		type: 'number',
		default: 1,
		required: true,
		description:
			'The per-project index of the task, i.e. the number after the dash in an identifier such as PROJ-42.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getByIndex'],
			},
		},
	},
	{
		displayName: 'Task Title',
		name: 'taskTitle',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'title',
			},
		},
		default: '',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Bucket ID',
				name: 'bucketId',
				type: 'number',
				default: 0,
				description: 'The ID of the bucket you want to put this task into',
				routing: {
					send: {
						type: 'body',
						property: 'bucket_id',
					},
				},
			},
			{
				displayName: 'Cover Image Attachment ID',
				name: 'coverImageAttachmentId',
				type: 'number',
				default: 0,
				description:
					'The ID of an existing attachment of this task to display as its cover image. Upload the attachment first.',
				routing: {
					send: {
						type: 'body',
						property: 'cover_image_attachment_id',
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description for the task. Vikunja stores this as HTML.',
				typeOptions: {
					rows: 4,
				},
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Done',
				name: 'done',
				type: 'boolean',
				default: false,
				description: 'Whether this task is done',
				routing: {
					send: {
						type: 'body',
						property: 'done',
					},
				},
			},
			{
				displayName: 'Due Date Time',
				name: 'dueDateTime',
				type: 'dateTime',
				default: '',
				description: 'Specific date and time in RFC3339 format',
				routing: {
					send: {
						type: 'body',
						property: 'due_date',
					},
				},
			},
			{
				displayName: 'End Date Time',
				name: 'endDateTime',
				type: 'dateTime',
				default: '',
				description: 'Specific date and time in RFC3339 format',
				routing: {
					send: {
						type: 'body',
						property: 'end_date',
					},
				},
			},
			{
				displayName: 'Favorite',
				name: 'isFavorite',
				type: 'boolean',
				default: false,
				description: 'Whether this task is set as a favorite task',
				routing: {
					send: {
						type: 'body',
						property: 'is_favorite',
					},
				},
			},
			{
				displayName: 'Percent Done',
				name: 'percentDone',
				type: 'number',
				typeOptions: {
					maxValue: 1,
					minValue: 0,
					numberPrecision: 2,
				},
				default: 0,
				description: 'The progress of the task, as a fraction between 0 and 1',
				routing: {
					send: {
						type: 'body',
						property: 'percent_done',
					},
				},
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Unset', value: 0 },
					{ name: 'Low', value: 1 },
					{ name: 'Medium', value: 2 },
					{ name: 'High', value: 3 },
					{ name: 'Urgent', value: 4 },
					{ name: 'DO NOW', value: 5 },
				],
				default: 0,
				description: 'The task priority',
				routing: {
					send: {
						type: 'body',
						property: 'priority',
					},
				},
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'number',
				default: 0,
				description: 'Move the task to this project. Only useful when updating a task.',
				routing: {
					send: {
						type: 'body',
						property: 'project_id',
					},
				},
			},
			{
				displayName: 'Repeat After',
				name: 'repeatAfter',
				type: 'number',
				default: 0,
				description: 'The amount in seconds after this task will repeat',
				routing: {
					send: {
						type: 'body',
						property: 'repeat_after',
					},
				},
			},
			{
				displayName: 'Repeat Mode',
				name: 'repeatMode',
				type: 'options',
				options: [
					{
						name: 'Repeat After Amount',
						description: 'Repeat after the amount specified in repeat_after',
						value: 0,
					},
					{
						name: 'Repeat Monthly',
						description: 'Repeat all dates each months (ignoring repeat_after)',
						value: 1,
					},
					{
						name: 'Repeat From Current Date',
						description: 'Repeat from the current date rather than the last set date',
						value: 2,
					},
				],
				default: 0,
				description:
					'How a repeating task will repeat itself. Will be triggered when a task is marked done.',
				routing: {
					send: {
						type: 'body',
						property: 'repeat_mode',
					},
				},
			},
			{
				displayName: 'Start Date Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Specific date and time in RFC3339 format',
				routing: {
					send: {
						type: 'body',
						property: 'start_date',
					},
				},
			},
			{
				displayName: 'Task Color',
				name: 'hexColor',
				type: 'color',
				default: '#000000',
				routing: {
					send: {
						type: 'body',
						property: 'hex_color',
					},
				},
			},
		],
	},
	{
		displayName: 'Reminders',
		name: 'reminders',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Reminder',
		description:
			'Reminders replace the existing ones on update. Leave empty to keep the task without reminders.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				name: 'reminder',
				displayName: 'Reminder',
				values: [
					{
						displayName: 'Relative To',
						name: 'relative_to',
						type: 'options',
						default: '',
						description:
							'Anchor the reminder to one of the task dates. Leave unset to use an absolute date.',
						options: [
							{ name: 'Absolute Date', value: '' },
							{ name: 'Due Date', value: 'due_date' },
							{ name: 'End Date', value: 'end_date' },
							{ name: 'Start Date', value: 'start_date' },
						],
					},
					{
						displayName: 'Absolute Date',
						name: 'reminder',
						type: 'dateTime',
						default: '',
						displayOptions: {
							show: {
								relative_to: [''],
							},
						},
					},
					{
						displayName: 'Relative Period (Seconds)',
						name: 'relative_period',
						type: 'number',
						default: -3600,
						description:
							'Seconds relative to the anchor date. Negative values fire the reminder before that date.',
						displayOptions: {
							hide: {
								relative_to: [''],
							},
						},
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'reminders',
				value: '={{ $value.reminder ?? [] }}',
			},
		},
	},
	{
		displayName: 'Task IDs',
		name: 'bulkTaskIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '12,34,56',
		description: 'Comma-separated list of the task IDs to update',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['bulkUpdate'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'task_ids',
				value:
					'={{ $value.toString().split(",").map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0) }}',
			},
		},
	},
	{
		displayName: 'Fields to Update',
		name: 'bulkFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'The fields set here are applied to every task listed above',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['bulkUpdate'],
			},
		},
		options: [
			// The option names are the Vikunja field names on purpose: they are
			// forwarded verbatim in the `fields` array of the request.
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				routing: { send: { type: 'body', property: 'values.description' } },
			},
			{
				displayName: 'Done',
				name: 'done',
				type: 'boolean',
				default: false,
				routing: { send: { type: 'body', property: 'values.done' } },
			},
			{
				displayName: 'Due Date',
				name: 'due_date',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'values.due_date' } },
			},
			{
				displayName: 'End Date',
				name: 'end_date',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'values.end_date' } },
			},
			{
				displayName: 'Percent Done',
				name: 'percent_done',
				type: 'number',
				typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'values.percent_done' } },
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Unset', value: 0 },
					{ name: 'Low', value: 1 },
					{ name: 'Medium', value: 2 },
					{ name: 'High', value: 3 },
					{ name: 'Urgent', value: 4 },
					{ name: 'DO NOW', value: 5 },
				],
				default: 0,
				routing: { send: { type: 'body', property: 'values.priority' } },
			},
			{
				displayName: 'Project ID',
				name: 'project_id',
				type: 'number',
				default: 0,
				description: 'Move every listed task to this project',
				routing: { send: { type: 'body', property: 'values.project_id' } },
			},
			{
				displayName: 'Start Date',
				name: 'start_date',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'values.start_date' } },
			},
		],
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['assignUser', 'unassignUser'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'user_id',
			},
		},
	},
	{
		displayName: 'User IDs',
		name: 'assigneeUserIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '1,2,3',
		description:
			'Comma-separated list of user IDs. These replace the current assignees of the task.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['assignUsersBulk'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'assignees',
				value:
					'={{ $value.toString().split(",").map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0).map(id => ({ id })) }}',
			},
		},
	},
	{
		displayName: 'Label IDs',
		name: 'bulkLabelIds',
		type: 'string',
		default: '',
		placeholder: '1,2,3',
		description:
			'Comma-separated list of label IDs. These replace the current labels of the task; an empty value removes them all.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['setLabels'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'labels',
				value:
					'={{ $value.toString().split(",").map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0).map(id => ({ id })) }}',
			},
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['deleteComment', 'getComment', 'updateComment'],
			},
		},
	},
	{
		displayName: 'Comment Text',
		name: 'commentText',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addComment', 'updateComment'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'comment',
			},
		},
		default: '',
		required: true,
	},
	{
		displayName: 'Other Task ID',
		description: 'The ID of the other task you want to relate the current one with',
		name: 'otherTaskId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addRelation', 'removeRelation'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'other_task_id',
			},
		},
	},
	{
		displayName: 'Relation Kind',
		name: 'relationKind',
		type: 'options',
		options: [
			{
				name: 'Blocked',
				value: 'blocked',
			},
			{
				name: 'Blocking',
				value: 'blocking',
			},
			{
				name: 'Copied From',
				value: 'copiedfrom',
			},
			{
				name: 'Copied To',
				value: 'copiedto',
			},
			{
				name: 'Duplicate Of',
				value: 'duplicateof',
			},
			{
				name: 'Duplicates',
				value: 'duplicates',
			},
			{
				name: 'Follows',
				value: 'follows',
			},
			{
				name: 'Parent Task',
				value: 'parenttask',
			},
			{
				name: 'Precedes',
				value: 'precedes',
			},
			{
				name: 'Related Task',
				value: 'related',
			},
			{
				name: 'Sub Task',
				value: 'subtask',
			},
		],
		default: 'related',
		description: 'The kind of relation between tasks',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addRelation', 'removeRelation'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'relation_kind',
			},
		},
	},
	{
		displayName: 'Project View ID',
		name: 'view',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a project view...',
				typeOptions: {
					searchListMethod: 'searchProjectViews',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'Enter Project View ID',
			},
		],
		routing: {
			send: {
				type: 'body',
				// `Move to a Bucket` posts a TaskBucket, which names the same value
				// project_view_id, while the position endpoint expects view_id.
				property: '={{ $parameter.operation === "moveToBucket" ? "project_view_id" : "view_id" }}',
			},
		},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAllInView', 'moveToBucket', 'updateTaskPosition'],
			},
		},
		description: 'The project view you want to operate on',
	},
	{
		displayName: 'Bucket ID',
		name: 'bucketId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The kanban bucket of the selected view to move the task into',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['moveToBucket'],
			},
		},
	},
	{
		displayName: 'Task Position',
		name: 'taskPosition',
		type: 'number',
		description: 'A numeric value used to determine the position of this task',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['updateTaskPosition'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'position',
			},
		},
		default: 0,
	},
	{
		displayName: 'Target Project ID',
		name: 'duplicateTargetProject',
		type: 'number',
		default: 0,
		description:
			'The project the task is duplicated into. Leave at 0 to duplicate it inside its current project.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['duplicate'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'project_id',
			},
		},
	},
	{
		displayName: 'Attachment ID',
		name: 'attachmentId',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['deleteAttachment', 'downloadAttachment'],
			},
		},
	},
	{
		displayName: 'Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The input field holding the file to upload, or the output field the download is written to',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['downloadAttachment', 'uploadAttachment'],
			},
		},
	},
	{
		displayName: 'Task or Comment ID',
		description: 'The ID of the task or comment you want to react on',
		name: 'reactionEntityID',
		type: 'number',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addReaction', 'getReactions', 'removeReaction'],
			},
		},
	},
	{
		displayName: 'Reaction Kind',
		name: 'reactionKind',
		type: 'options',
		required: true,
		options: [
			{
				name: 'Task',
				value: 'tasks',
			},
			{
				name: 'Comment',
				value: 'comments',
			},
		],
		default: 'tasks',
		description: 'The entity you want to react on',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addReaction', 'getReactions', 'removeReaction'],
			},
		},
	},
	{
		displayName: 'Reaction',
		name: 'reactionValue',
		type: 'string',
		description:
			'The actual reaction value. Usually you want to use an emoji here, but this can be any valid utf character or text, up to a length of 20.',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['addReaction', 'removeReaction'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'value',
			},
		},
		default: '',
		required: true,
	},
	{
		displayName: 'Comment Order',
		name: 'commentOrder',
		type: 'options',
		default: 'asc',
		description: 'The order the comments are returned in',
		options: [
			{ name: 'Oldest First', value: 'asc' },
			{ name: 'Newest First', value: 'desc' },
		],
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getAllComments'],
			},
		},
	},
	mergeWithExistingProperty('task'),
	...paginationProperties('task', [...TASK_COLLECTION_OPERATIONS, ...OTHER_COLLECTION_OPERATIONS]),
	taskQueryOptions(TASK_COLLECTION_OPERATIONS),
];
