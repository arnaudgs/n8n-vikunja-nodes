import {
	type IDataObject,
	type IHookFunctions,
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';
import { createHmac } from 'crypto';
import { apiRequest, getWebhookEvents } from './helper';

export class VikunjaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vikunja Trigger',
		name: 'vikunjaTrigger',
		icon: 'file:vikunja.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Vikunja events occur',
		defaults: {
			name: 'Vikunja Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'vikunjaApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				// Kept as a plain number rather than a resource locator so that
				// workflows created with earlier versions of this node keep working.
				displayName: 'Project ID',
				name: 'project',
				type: 'number',
				required: true,
				default: 0,
				description: 'The numeric ID of the project whose events start this workflow',
			},
			{
				displayName: 'Event Names or IDs',
				name: 'events',
				type: 'multiOptions',
				default: [],
				required: true,
				description:
					'The webhook events which should fire this webhook target. The list is read from the connected Vikunja instance. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				typeOptions: {
					loadOptionsMethod: 'getWebhookEvents',
				},
			},
			{
				displayName: 'Secret',
				name: 'secret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description:
					'When set, Vikunja signs each request with this secret and the trigger rejects requests whose signature does not match. Strongly recommended, since the webhook URL is otherwise callable by anyone.',
			},
		],
	};

	methods = {
		loadOptions: {
			getWebhookEvents,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Check all the webhooks which exist already if it is identical to the
				// one that is supposed to get created.
				const projectId = this.getNodeParameter('project') as number;
				const endpoint = `/projects/${projectId}/webhooks`;

				const responseData = await apiRequest.call(this, 'GET', endpoint);

				const webhookUrl = this.getNodeWebhookUrl('default');

				for (const webhook of responseData ?? []) {
					if (webhook.target_url === webhookUrl) {
						// Set webhook-id to be sure that it can be deleted
						const webhookData = this.getWorkflowStaticData('node');
						webhookData.webhookId = webhook.id as number;
						return true;
					}
				}

				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const projectId = this.getNodeParameter('project') as number;
				const endpoint = `/projects/${projectId}/webhooks`;

				const events = this.getNodeParameter('events') as string[];
				if (!events.length) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one event has to be selected, otherwise Vikunja never calls the webhook',
					);
				}

				const secret = this.getNodeParameter('secret', '') as string;

				const body: IDataObject = {
					target_url: webhookUrl,
					events,
				};
				if (secret) body.secret = secret;

				const responseData = await apiRequest.call(this, 'PUT', endpoint, body);

				if (responseData.id === undefined) {
					// Required data is missing so was not successful
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = responseData.id as string;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const projectId = this.getNodeParameter('project') as number;
					const endpoint = `/projects/${projectId}/webhooks/${webhookData.webhookId}`;

					try {
						await apiRequest.call(this, 'DELETE', endpoint);
					} catch (error) {
						return false;
					}

					// Remove from the static workflow data so that it is clear
					// that no webhooks are registered anymore
					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const secret = this.getNodeParameter('secret', '') as string;

		if (secret) {
			// Vikunja signs the raw JSON body with HMAC-SHA256 and sends the hex
			// digest in X-Vikunja-Signature, see https://vikunja.io/docs/webhooks.
			const headerData = this.getHeaderData() as IDataObject;
			const receivedSignature = String(headerData['x-vikunja-signature'] ?? '');

			// The raw bytes matter: Go escapes <, > and & as \u003c and friends when
			// it marshals the payload, so re-serialising the parsed body would
			// produce a different digest for any task holding HTML.
			const request = this.getRequestObject();
			const rawBody = request.rawBody;
			const signedPayload =
				Buffer.isBuffer(rawBody) && rawBody.length > 0 ? rawBody : JSON.stringify(bodyData);

			const expectedSignature = createHmac('sha256', secret).update(signedPayload).digest('hex');

			if (receivedSignature !== expectedSignature) {
				// Returning nothing acknowledges the call without starting a run, the
				// convention n8n triggers use for a failed signature check.
				return {};
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
