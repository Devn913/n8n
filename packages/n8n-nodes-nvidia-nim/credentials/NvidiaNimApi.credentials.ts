import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NvidiaNimApi implements ICredentialType {
	name = 'nvidiaNimApi';

	displayName = 'NVIDIA NIM API';

	documentationUrl = 'https://docs.api.nvidia.com/nim/reference/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your NVIDIA NIM API key. Obtain one from <a href="https://build.nvidia.com/" target="_blank">build.nvidia.com</a>.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://integrate.api.nvidia.com/v1',
			description:
				'Base URL for the NVIDIA NIM API. Override this if you are running a self-hosted NIM instance.',
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/models',
		},
	};
}
