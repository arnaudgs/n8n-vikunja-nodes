import { INodeProperties } from 'n8n-workflow';
import { vikunjaPagination } from '../helper';

/**
 * Routing fragment every "get many" operation has to declare so that
 * {@link vikunjaPagination} takes over the paging.
 */
export const paginatedOperation = {
	send: { paginate: true },
	operations: { pagination: vikunjaPagination },
};

/**
 * `Return All` / `Limit` pair, matching the convention used across n8n nodes.
 * Vikunja caps `per_page` server side, so a limit above one page is satisfied
 * by fetching several pages rather than by a single large request.
 */
export function paginationProperties(resource: string, operations: string[]): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			description: 'Max number of results to return',
			typeOptions: {
				minValue: 1,
			},
			default: 50,
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
					returnAll: [false],
				},
			},
		},
	];
}

/**
 * Search box shared by the collection endpoints that support Vikunja's `s`
 * parameter (labels, teams, users, assignees, …).
 */
export function searchProperty(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		description: 'Only return items matching this search term. Left to the server to evaluate.',
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 's',
			},
		},
	};
}

/**
 * Query options of Vikunja's task collection endpoints (`GET /tasks`,
 * `GET /projects/{id}/tasks` and `GET /projects/{id}/views/{view}/tasks`).
 * These were missing entirely before, which meant every filter had to be
 * rebuilt with a downstream Filter node.
 */
export function taskQueryOptions(operations: string[]): INodeProperties {
	return {
		displayName: 'Query Options',
		name: 'queryOptions',
		type: 'collection',
		placeholder: 'Add Query Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: operations,
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'options',
				default: 'subtasks',
				description:
					'Fetch additional related data along with each task. Increases response time considerably on large projects.',
				options: [
					{ name: 'Attachments', value: 'attachments' },
					{ name: 'Buckets', value: 'buckets' },
					{ name: 'Comments', value: 'comments' },
					{ name: 'Reactions', value: 'reactions' },
					{ name: 'Subtasks', value: 'subtasks' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'expand',
					},
				},
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				default: '',
				placeholder: 'done = false && due_date < now',
				description:
					'Vikunja filter query used to match tasks. See https://vikunja.io/docs/filters for the full syntax.',
				routing: {
					send: {
						type: 'query',
						property: 'filter',
					},
				},
			},
			{
				displayName: 'Filter Include Nulls',
				name: 'filterIncludeNulls',
				type: 'boolean',
				default: false,
				description:
					'Whether tasks whose filtered field is null are included in the result. Off by default in Vikunja.',
				routing: {
					send: {
						type: 'query',
						property: 'filter_include_nulls',
					},
				},
			},
			{
				displayName: 'Filter Timezone',
				name: 'filterTimezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Paris',
				description:
					'The time zone used to evaluate date maths in the filter, such as now/d. Defaults to the timezone of the Vikunja server.',
				routing: {
					send: {
						type: 'query',
						property: 'filter_timezone',
					},
				},
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'asc',
				description: 'The direction the results are sorted in',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'order_by',
					},
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Only return tasks whose text matches this search term',
				routing: {
					send: {
						type: 'query',
						property: 's',
					},
				},
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				default: 'id',
				description: 'The task field the results are sorted by',
				options: [
					{ name: 'Created', value: 'created' },
					{ name: 'Done', value: 'done' },
					{ name: 'Done At', value: 'done_at' },
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
						type: 'query',
						property: 'sort_by',
					},
				},
			},
		],
	};
}
