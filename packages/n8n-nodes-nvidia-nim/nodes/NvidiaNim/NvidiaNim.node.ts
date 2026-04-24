import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { nvidiaNimFields } from './NvidiaNimDescription';

interface NvidiaNimMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface NvidiaNimUsage {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
}

interface NvidiaNimChoice {
	index?: number;
	message?: NvidiaNimMessage;
	delta?: { content?: string };
	finish_reason?: string | null;
}

interface NvidiaNimResponse {
	id?: string;
	object?: string;
	created?: number;
	model?: string;
	choices?: NvidiaNimChoice[];
	usage?: NvidiaNimUsage;
}

interface NvidiaNimOptions {
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	stop?: string;
	stream?: boolean;
}

function toApiErrorPayload(message: string, extra?: unknown): JsonObject {
	const payload: Record<string, unknown> = { message };
	if (extra !== null && extra !== undefined && typeof extra === 'object') {
		for (const [k, v] of Object.entries(extra as Record<string, unknown>)) {
			try {
				// Only include JSON-serialisable values
				JSON.stringify(v);
				payload[k] = v;
			} catch {
				// skip non-serialisable values
			}
		}
	}
	return payload as JsonObject;
}

export class NvidiaNim implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NVIDIA NIM',
		name: 'nvidiaNim',
		icon: 'file:nvidia-nim.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'GPU-accelerated inference for LLMs via NVIDIA NIM microservices',
		defaults: {
			name: 'NVIDIA NIM',
		},
		usableAsTool: true,
		codex: {
			alias: ['nvidia', 'nim', 'llama', 'mistral', 'gpu', 'inference', 'AI'],
			categories: ['AI'],
			subcategories: {
				AI: ['Agents', 'Miscellaneous', 'Root Nodes'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/Devn913/n8n/tree/master/packages/n8n-nodes-nvidia-nim#readme',
					},
				],
			},
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'nvidiaNimApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials?.baseUrl ?? "https://integrate.api.nvidia.com/v1" }}',
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
				],
				default: 'chat',
			},
			...nvidiaNimFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('nvidiaNimApi');
		const baseUrl =
			(credentials.baseUrl as string | undefined) ?? 'https://integrate.api.nvidia.com/v1';
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'chat' && operation === 'completions') {
					const messagesParam = this.getNodeParameter('messages.values', i, []) as Array<{
						role: string;
						content: string;
					}>;

					const modelSelected = this.getNodeParameter('model', i, '') as string;
					const modelOverride = this.getNodeParameter('modelOverride', i, '') as string;
					const model = modelOverride.trim() !== '' ? modelOverride.trim() : modelSelected;

					if (!model) {
						throw new NodeOperationError(
							this.getNode(),
							'No model selected. Please choose a model or enter a model ID.',
							{ itemIndex: i },
						);
					}

					if (messagesParam.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'At least one message is required.',
							{ itemIndex: i },
						);
					}

					const messages: NvidiaNimMessage[] = messagesParam.map((m) => ({
						role: m.role as NvidiaNimMessage['role'],
						content: m.content,
					}));

					const options = this.getNodeParameter('options', i, {}) as NvidiaNimOptions;
					const simplify = this.getNodeParameter('simplify', i, true) as boolean;
					const stream = options.stream ?? false;

					const body: Record<string, unknown> = {
						model,
						messages,
						stream,
					};

					if (options.temperature !== undefined) body.temperature = options.temperature;
					if (options.max_tokens !== undefined) body.max_tokens = options.max_tokens;
					if (options.top_p !== undefined) body.top_p = options.top_p;
					if (options.frequency_penalty !== undefined)
						body.frequency_penalty = options.frequency_penalty;
					if (options.presence_penalty !== undefined)
						body.presence_penalty = options.presence_penalty;
					if (options.stop) {
						body.stop = options.stop
							.split(',')
							.map((s: string) => s.trim())
							.filter(Boolean);
					}

					let responseData: NvidiaNimResponse;
					try {
						responseData = (await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/chat/completions`,
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body,
							json: true,
						})) as NvidiaNimResponse;
					} catch (httpError) {
						const err = httpError as {
							response?: { status?: number; data?: unknown };
							message?: string;
						};
						const status = err.response?.status;

						if (status === 401 || status === 403) {
							throw new NodeApiError(
								this.getNode(),
								toApiErrorPayload(
									'Authentication failed. Please check your NVIDIA NIM API key.',
									err.response?.data,
								),
								{
									message: 'Authentication failed: invalid or missing API key.',
									httpCode: String(status),
									itemIndex: i,
								},
							);
						}
						if (status === 429) {
							throw new NodeApiError(
								this.getNode(),
								toApiErrorPayload('Rate limit exceeded.', err.response?.data),
								{
									message: 'Rate limit exceeded. Please wait before retrying.',
									httpCode: '429',
									itemIndex: i,
								},
							);
						}
						if (status === 404) {
							throw new NodeApiError(
								this.getNode(),
								toApiErrorPayload(
									`Model "${model}" not found or endpoint mismatch.`,
									err.response?.data,
								),
								{
									message: `Model "${model}" was not found. Check the model name and base URL.`,
									httpCode: '404',
									itemIndex: i,
								},
							);
						}
						throw new NodeApiError(
							this.getNode(),
							toApiErrorPayload(
								err.message ?? 'NVIDIA NIM API request failed.',
								err.response?.data,
							),
							{
								message: `NVIDIA NIM API error: ${err.message ?? 'Unknown error'}`,
								itemIndex: i,
							},
						);
					}

					if (simplify) {
						const text = responseData.choices?.[0]?.message?.content ?? '';
						returnData.push({
							json: { content: text },
							pairedItem: { item: i },
						});
					} else {
						returnData.push({
							json: {
								choices: (responseData.choices ?? []) as unknown[],
								usage: (responseData.usage ?? {}) as Record<string, number>,
								id: responseData.id,
								model: responseData.model,
								created: responseData.created,
								object: responseData.object,
								_raw: responseData as unknown as Record<string, unknown>,
							},
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionError = error as Error;
					returnData.push({
						json: {
							error: executionError.message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
