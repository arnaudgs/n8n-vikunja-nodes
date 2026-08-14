import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VikunjaApi implements ICredentialType {
	name = 'vikunjaApi';
	displayName = 'Vikunja API';
	documentationUrl = 'https://vikunja.io/docs/api-documentation/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			description:
				'An API token created under Settings → API Tokens, or a JWT obtained from /login. Make sure the token has permissions for every resource the workflow uses.',
			default: '',
		},
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			description:
				'The full api url, complete with the /api/v1 suffix. A trailing slash is stripped automatically.',
			placeholder: 'https://vikunja.example.com/api/v1',
			default: 'https://app.vikunja.cloud/api/v1',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
	test?: ICredentialTestRequest = {
		request: {
			// /user is readable by every token regardless of its permission scopes,
			// unlike /token/test which older versions of this node relied on.
			baseURL: '={{ $credentials.apiUrl.replace(new RegExp("/+$"), "") }}',
			url: '/user',
			method: 'GET',
		},
	};
}
