import type { INodeProperties } from 'n8n-workflow';

export const nvidiaNimFields: INodeProperties[] = [
	// ─────────────────────────────────────────────
	// Resource: chat
	// ─────────────────────────────────────────────
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['chat'],
			},
		},
		options: [
			{
				name: 'Completions',
				value: 'completions',
				description: 'Create a chat completion using a NIM-hosted model',
				action: 'Create a chat completion',
			},
		],
		default: 'completions',
	},

	// ─────────────────────────────────────────────
	// Model selector
	// ─────────────────────────────────────────────
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['completions'],
			},
		},
		typeOptions: {
			loadOptions: {
				routing: {
					request: {
						method: 'GET',
						url: '/models',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
							{
								type: 'setKeyValue',
								properties: {
									name: '={{$responseItem.id}}',
									value: '={{$responseItem.id}}',
								},
							},
							{
								type: 'sort',
								properties: {
									key: 'name',
								},
							},
						],
					},
				},
			},
		},
		description:
			'Model to use for completion. <a href="https://build.nvidia.com/explore/discover" target="_blank">Browse models</a>.',
		default: 'meta/llama-3.1-8b-instruct',
		routing: {
			send: {
				type: 'body',
				property: 'model',
			},
		},
	},
	{
		displayName: 'Or Enter Model ID',
		name: 'modelOverride',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['completions'],
			},
		},
		default: '',
		placeholder: 'e.g. mistralai/mistral-nemo',
		description:
			'Enter a custom model ID to override the selection above. Leave empty to use the model selected above.',
	},

	// ─────────────────────────────────────────────
	// Messages
	// ─────────────────────────────────────────────
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			sortable: true,
			multipleValues: true,
		},
		placeholder: 'Add Message',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['completions'],
			},
		},
		default: {
			values: [
				{
					role: 'user',
					content: '',
				},
			],
		},
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						description: 'The role of this message in the conversation',
						options: [
							{
								name: 'System',
								value: 'system',
								description: 'System-level instructions for the model',
							},
							{
								name: 'User',
								value: 'user',
								description: 'Message from the user',
							},
							{
								name: 'Assistant',
								value: 'assistant',
								description: 'Previous assistant response (for conversation history)',
							},
						],
						default: 'user',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						default: '',
						placeholder: 'e.g. You are a helpful assistant.',
						typeOptions: {
							rows: 3,
						},
						description: 'The text content of this message',
					},
				],
			},
		],
	},

	// ─────────────────────────────────────────────
	// Simplify Output
	// ─────────────────────────────────────────────
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['completions'],
			},
		},
		default: true,
		description:
			'Whether to return only the assistant message text, or include the full API response with choices, usage, and metadata',
	},

	// ─────────────────────────────────────────────
	// Options (advanced)
	// ─────────────────────────────────────────────
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['completions'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.7,
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				description:
					'Controls randomness in responses. Lower values make output more focused and deterministic.',
			},
			{
				displayName: 'Max Tokens',
				name: 'max_tokens',
				type: 'number',
				default: 1024,
				typeOptions: { minValue: 1, numberPrecision: 0 },
				description: 'Maximum number of tokens to generate in the completion',
			},
			{
				displayName: 'Top P',
				name: 'top_p',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				description:
					'Controls diversity via nucleus sampling. Reduce to consider only the most probable tokens.',
			},
			{
				displayName: 'Frequency Penalty',
				name: 'frequency_penalty',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
				description:
					"Penalises tokens based on how often they appear so far, reducing the model's likelihood to repeat itself",
			},
			{
				displayName: 'Presence Penalty',
				name: 'presence_penalty',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
				description:
					"Penalises tokens that have already appeared, encouraging the model to talk about new topics",
			},
			{
				displayName: 'Stop Sequences',
				name: 'stop',
				type: 'string',
				default: '',
				placeholder: 'e.g. \\n,END',
				description:
					'Comma-separated list of sequences where the model will stop generating further tokens',
			},
			{
				displayName: 'Stream',
				name: 'stream',
				type: 'boolean',
				default: false,
				description:
					'Whether to stream the response back incrementally (server-sent events). When enabled, individual token chunks are returned as separate output items.',
			},
		],
	},
];
