import { INodeProperties } from 'n8n-workflow';

/**
 * Saved filters (`/filters`). Vikunja exposes them as pseudo projects whose id
 * is negative, which is why there is no "get many" route: they show up in
 * `GET /projects` alongside the real ones.
 */
export const savedFilterProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['savedFilter'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a saved filter',
				action: 'Create a saved filter',
				routing: {
					request: {
						method: 'PUT',
						url: '/filters',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a saved filter',
				action: 'Delete a saved filter',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/filters/{{$parameter.savedFilterId}}',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a saved filter',
				action: 'Get a saved filter',
				routing: {
					request: {
						method: 'GET',
						url: '=/filters/{{$parameter.savedFilterId}}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a saved filter',
				action: 'Update a saved filter',
				routing: {
					request: {
						method: 'POST',
						url: '=/filters/{{$parameter.savedFilterId}}',
					},
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Saved Filter ID',
		name: 'savedFilterId',
		type: 'number',
		default: '',
		required: true,
		description:
			'The numeric ID of the saved filter. Note this is not the negative pseudo project ID shown in the frontend URL.',
		displayOptions: {
			show: {
				resource: ['savedFilter'],
				operation: ['delete', 'get', 'update'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'savedFilterTitle',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['savedFilter'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'title',
			},
		},
	},
	{
		displayName: 'Filter Query',
		name: 'savedFilterQuery',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'done = false && due_date < now/w+1w',
		description:
			'The filter query itself. See https://vikunja.io/docs/filters for the full syntax.',
		displayOptions: {
			show: {
				resource: ['savedFilter'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'filters.filter',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'savedFilterOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['savedFilter'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Favorite',
				name: 'isFavorite',
				type: 'boolean',
				default: false,
				description: 'Whether the filter shows up among the favorites',
				routing: {
					send: {
						type: 'body',
						property: 'is_favorite',
					},
				},
			},
			{
				displayName: 'Include Nulls',
				name: 'filterIncludeNulls',
				type: 'boolean',
				default: false,
				description: 'Whether tasks whose filtered field is null are included',
				routing: {
					send: {
						type: 'body',
						property: 'filters.filter_include_nulls',
					},
				},
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'asc',
				description: 'The direction the tasks of the filter are sorted in',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: {
					send: {
						type: 'body',
						property: 'filters.order_by',
						// The API takes an array here, one entry per sort_by entry.
						value: '={{ [$value] }}',
					},
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Restrict the filter to tasks matching this search term',
				routing: {
					send: {
						type: 'body',
						property: 'filters.s',
					},
				},
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				default: 'due_date',
				description: 'The task field the tasks of the filter are sorted by',
				options: [
					{ name: 'Created', value: 'created' },
					{ name: 'Done', value: 'done' },
					{ name: 'Due Date', value: 'due_date' },
					{ name: 'End Date', value: 'end_date' },
					{ name: 'ID', value: 'id' },
					{ name: 'Percent Done', value: 'percent_done' },
					{ name: 'Position', value: 'position' },
					{ name: 'Priority', value: 'priority' },
					{ name: 'Start Date', value: 'start_date' },
					{ name: 'Title', value: 'title' },
					{ name: 'Updated', value: 'updated' },
				],
				routing: {
					send: {
						type: 'body',
						property: 'filters.sort_by',
						value: '={{ [$value] }}',
					},
				},
			},
		],
	},
];
