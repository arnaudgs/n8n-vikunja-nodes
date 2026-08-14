import {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeListSearchResult,
	INodeProperties,
	INodePropertyOptions,
	IRequestOptions,
	JsonObject,
	NodeApiError,
	IExecuteFunctions,
} from 'n8n-workflow';

/**
 * The maximum number of items Vikunja returns per page. The server caps
 * `per_page` at its own `maxitemsperpage` setting (50 by default), so asking
 * for more than that silently yields fewer items — which is why every
 * "get many" operation has to paginate instead of sending a large per_page.
 */
export const VIKUNJA_MAX_PER_PAGE = 50;

/**
 * Trailing slashes in the stored API url would produce `//tasks` style
 * endpoints, which Vikunja answers with a 404. The declarative side does the
 * same through `requestDefaults.baseURL`, so both code paths agree.
 */
export function normaliseApiUrl(apiUrl: string): string {
	return (apiUrl || '').trim().replace(/\/+$/, '');
}

export async function apiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: object,
	query?: IDataObject,
): Promise<any> {
	query = query || {};
	body = body || {};

	const credentialType = 'vikunjaApi';
	const { apiUrl } = await this.getCredentials(credentialType);

	const options: IRequestOptions = {
		method,
		body,
		qs: query,
		uri: normaliseApiUrl(apiUrl as string) + endpoint,
		json: true,
	};

	return this.helpers.requestWithAuthentication.call(this, credentialType, options);
}

/**
 * Fetches every page of a paginated Vikunja collection endpoint.
 */
export async function apiRequestAllItems(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: object,
	query?: IDataObject,
	maxItems = Infinity,
): Promise<IDataObject[]> {
	const items: IDataObject[] = [];
	let page = 1;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const response = await apiRequest.call(this, method, endpoint, body, {
			...(query ?? {}),
			page,
			per_page: VIKUNJA_MAX_PER_PAGE,
		});

		if (!Array.isArray(response) || response.length === 0) break;

		items.push(...(response as IDataObject[]));

		if (items.length >= maxItems) return items.slice(0, maxItems);
		if (response.length < VIKUNJA_MAX_PER_PAGE) break;

		page++;
	}

	return items;
}

/**
 * Backs a `resourceLocator` list mode. Vikunja filters server-side through the
 * `s` parameter, so the filter typed by the user is forwarded instead of only
 * searching within the first 50 results.
 */
export async function searchAndMap(
	context: ILoadOptionsFunctions,
	url: string,
	titleProperty: string = 'title',
	filter?: string,
	extraQuery?: IDataObject,
): Promise<INodeListSearchResult> {
	try {
		const query: IDataObject = { ...(extraQuery ?? {}) };
		if (filter) query.s = filter;

		const items = await apiRequestAllItems.call(context, 'GET', url, {}, query, 200);

		return {
			results: items
				.map((item: IDataObject) => ({
					name: String(item[titleProperty] ?? item.title ?? item.name ?? item.id),
					value: item.id as number,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		};
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
}

/**
 * Load options helper returning the webhook events supported by the connected
 * Vikunja instance, so the list stays correct across Vikunja upgrades instead
 * of being hardcoded in the node.
 */
export async function getWebhookEvents(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const events = (await apiRequest.call(this, 'GET', '/webhooks/events')) as string[];
		if (Array.isArray(events) && events.length) {
			return events.sort().map((event) => ({ name: event, value: event }));
		}
	} catch {
		// Fall through to the static list below: the endpoint requires a token
		// with sufficient permissions, and an unusable dropdown would be worse
		// than a slightly outdated one.
	}
	return FALLBACK_WEBHOOK_EVENTS.map((event) => ({ name: event, value: event }));
}

/**
 * Mirrors `GET /webhooks/events` of Vikunja 2.5.0, used when the live list
 * cannot be fetched.
 */
export const FALLBACK_WEBHOOK_EVENTS = [
	'project.deleted',
	'project.shared.team',
	'project.shared.user',
	'project.updated',
	'task.assignee.created',
	'task.assignee.deleted',
	'task.attachment.created',
	'task.attachment.deleted',
	'task.comment.created',
	'task.comment.deleted',
	'task.comment.edited',
	'task.created',
	'task.deleted',
	'task.overdue',
	'task.relation.created',
	'task.relation.deleted',
	'task.reminder.fired',
	'task.updated',
	'tasks.overdue',
];

/**
 * Pagination handler for every "get many" operation.
 *
 * Vikunja paginates with `page`/`per_page` and caps `per_page` server-side, so
 * neither of n8n's built-in `generic`/`offset` paginators fits: this walks the
 * pages until the requested amount of items is collected.
 */
export async function vikunjaPagination(
	this: IExecutePaginationFunctions,
	requestOptions: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	requestOptions.options.qs = requestOptions.options.qs ?? {};

	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const limit = returnAll ? Infinity : (this.getNodeParameter('limit', 50) as number);

	const items: INodeExecutionData[] = [];
	let page = 1;
	let previousFirstId: unknown;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		requestOptions.options.qs.page = page;
		requestOptions.options.qs.per_page = VIKUNJA_MAX_PER_PAGE;

		const responseData = await this.makeRoutingRequest(requestOptions);
		if (responseData.length === 0) break;

		// A handful of Vikunja collection endpoints ignore `page` altogether. They
		// would otherwise return the very same full page forever.
		const firstId = (responseData[0]?.json as IDataObject)?.id;
		if (page > 1 && firstId !== undefined && firstId === previousFirstId) break;
		previousFirstId = firstId;

		items.push(...responseData);

		// A short page means there is nothing left to fetch.
		if (responseData.length < VIKUNJA_MAX_PER_PAGE) break;
		if (items.length >= limit) break;

		page++;
	}

	return returnAll ? items : items.slice(0, limit);
}

/**
 * Fields Vikunja accepts on a task write. Everything else the API returns is
 * read-only and would either be ignored or rejected if sent back.
 */
const WRITABLE_TASK_FIELDS = [
	'title',
	'description',
	'done',
	'due_date',
	'start_date',
	'end_date',
	'priority',
	'percent_done',
	'hex_color',
	'repeat_after',
	'repeat_mode',
	'is_favorite',
	'project_id',
	'bucket_id',
	'cover_image_attachment_id',
	'reminders',
];

const WRITABLE_PROJECT_FIELDS = [
	'title',
	'description',
	'identifier',
	'hex_color',
	'is_archived',
	'is_favorite',
	'parent_project_id',
];

/**
 * `POST /tasks/{id}` and `POST /projects/{id}` replace the whole entity rather
 * than patching it, so a node that only sets a title silently wipes the
 * description, dates, colour and reminders. This reads the current entity first
 * and fills in every writable field the user did not set, which is what an
 * "update" operation is expected to do in n8n.
 */
export function mergeExistingEntity(
	endpoint: 'tasks' | 'projects',
	idParameter: string,
	writableFields: string[],
) {
	return async function (
		this: IExecuteSingleFunctions,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const body = (requestOptions.body ?? {}) as IDataObject;

		// An untouched Reminders collection sends an empty array, which would read
		// as "remove every reminder" instead of "leave them alone".
		if (Array.isArray(body.reminders) && body.reminders.length === 0) {
			delete body.reminders;
		}

		if (!(this.getNodeParameter('mergeWithExisting', true) as boolean)) {
			requestOptions.body = body;
			return requestOptions;
		}

		const rawId = this.getNodeParameter(idParameter, undefined, { extractValue: true });
		const id = typeof rawId === 'object' ? (rawId as IDataObject).value : rawId;

		const { apiUrl } = await this.getCredentials('vikunjaApi');
		const current = (await this.helpers.httpRequestWithAuthentication.call(this, 'vikunjaApi', {
			method: 'GET',
			url: `${normaliseApiUrl(apiUrl as string)}/${endpoint}/${id}`,
			json: true,
		})) as IDataObject;

		for (const field of writableFields) {
			if (body[field] === undefined && current[field] !== undefined) {
				body[field] = current[field];
			}
		}

		requestOptions.body = body;
		return requestOptions;
	};
}

export const mergeExistingTask = mergeExistingEntity('tasks', 'taskId', WRITABLE_TASK_FIELDS);
export const mergeExistingProject = mergeExistingEntity(
	'projects',
	'project',
	WRITABLE_PROJECT_FIELDS,
);

/**
 * Shared toggle for the two operations above.
 */
export function mergeWithExistingProperty(resource: string): INodeProperties {
	return {
		displayName: 'Merge With Existing',
		name: 'mergeWithExisting',
		type: 'boolean',
		default: true,
		description:
			'Whether fields left empty keep their current value. Vikunja replaces the whole entity on update, so turning this off clears every field the node does not set.',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['update'],
			},
		},
	};
}

/**
 * Turns an attachment download into a binary item. Vikunja serves the raw file
 * with a `Content-Disposition` header, which is the only place the original
 * file name is available.
 */
export async function attachmentToBinary(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const attachmentId = this.getNodeParameter('attachmentId', 0);

	const headers = (response.headers ?? {}) as IDataObject;
	const disposition = String(headers['content-disposition'] ?? '');
	const mimeType = String(headers['content-type'] ?? '') || undefined;

	const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
	const fileName = match ? decodeURIComponent(match[1]) : `attachment-${attachmentId}`;

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(response.body as Buffer),
		fileName,
		mimeType,
	);

	return [
		{
			json: {
				attachment_id: attachmentId,
				file_name: binaryData.fileName,
				mime_type: binaryData.mimeType,
				file_size: binaryData.fileSize,
			},
			binary: { [binaryPropertyName]: binaryData },
		},
	];
}

/**
 * Builds the multipart body Vikunja expects on `PUT /tasks/{id}/attachments`.
 * The file has to be sent as the `files` form field; a JSON body is rejected.
 */
export async function prepareAttachmentUpload(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const binaryData = this.helpers.assertBinaryData(binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(binaryPropertyName);

	const formData = new FormData();
	formData.append(
		'files',
		new Blob([new Uint8Array(buffer)], { type: binaryData.mimeType }),
		binaryData.fileName ?? 'file',
	);

	requestOptions.body = formData;

	// Letting the request keep an explicit JSON content type would stop the
	// multipart boundary from being generated.
	const headers = { ...(requestOptions.headers ?? {}) } as IDataObject;
	delete headers['Content-Type'];
	delete headers['content-type'];
	requestOptions.headers = headers as IHttpRequestOptions['headers'];
	requestOptions.json = false;

	return requestOptions;
}
