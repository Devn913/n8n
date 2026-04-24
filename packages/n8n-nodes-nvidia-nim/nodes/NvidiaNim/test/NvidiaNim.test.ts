import { NvidiaNim } from '../NvidiaNim.node';

describe('NvidiaNim node', () => {
	describe('node description', () => {
		it('should have correct node properties', () => {
			const node = new NvidiaNim();
			expect(node.description).toMatchObject({
				displayName: 'NVIDIA NIM',
				name: 'nvidiaNim',
				group: ['transform'],
				version: 1,
			});
		});

		it('should require nvidiaNimApi credentials', () => {
			const node = new NvidiaNim();
			expect(node.description.credentials).toEqual([
				{ name: 'nvidiaNimApi', required: true },
			]);
		});

		it('should have main input and output', () => {
			const node = new NvidiaNim();
			expect(node.description.inputs).toEqual(['main']);
			expect(node.description.outputs).toEqual(['main']);
		});

		it('should have chat resource with completions operation in properties', () => {
			const node = new NvidiaNim();
			const resourceProp = node.description.properties.find((p) => p.name === 'resource');
			expect(resourceProp).toBeDefined();
			expect(resourceProp?.options).toEqual([{ name: 'Chat', value: 'chat' }]);
			expect(resourceProp?.default).toBe('chat');
		});

		it('should be usable as a tool', () => {
			const node = new NvidiaNim();
			expect(node.description.usableAsTool).toBe(true);
		});
	});

	describe('execute', () => {
		it('should throw when no model is provided', async () => {
			const node = new NvidiaNim();

			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'resource') return 'chat';
					if (param === 'operation') return 'completions';
					if (param === 'messages.values') return [{ role: 'user', content: 'hi' }];
					if (param === 'model') return '';
					if (param === 'modelOverride') return '';
					if (param === 'options') return {};
					if (param === 'simplify') return true;
					return undefined;
				}),
				getNode: jest.fn().mockReturnValue({ name: 'NVIDIA NIM', type: 'nvidiaNim' }),
				continueOnFail: jest.fn().mockReturnValue(false),
				helpers: {
					httpRequest: jest.fn(),
				},
			};

			await expect(
				node.execute.call(mockContext as Parameters<typeof node.execute>[0]),
			).rejects.toThrow('No model selected');
		});

		it('should return simplified content when simplify is true', async () => {
			const node = new NvidiaNim();

			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'resource') return 'chat';
					if (param === 'operation') return 'completions';
					if (param === 'messages.values')
						return [{ role: 'user', content: 'Hello' }];
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'modelOverride') return '';
					if (param === 'options') return {};
					if (param === 'simplify') return true;
					return undefined;
				}),
				getNode: jest.fn().mockReturnValue({ name: 'NVIDIA NIM', type: 'nvidiaNim' }),
				continueOnFail: jest.fn().mockReturnValue(false),
				helpers: {
					httpRequest: jest.fn().mockResolvedValue({
						choices: [{ message: { content: 'Hello! How can I help you?' } }],
						usage: { prompt_tokens: 5, completion_tokens: 8, total_tokens: 13 },
					}),
				},
			};

			const result = await node.execute.call(mockContext as Parameters<typeof node.execute>[0]);

			expect(result[0][0].json).toEqual({ content: 'Hello! How can I help you?' });
			expect(mockContext.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: 'https://integrate.api.nvidia.com/v1/chat/completions',
					headers: expect.objectContaining({
						Authorization: 'Bearer nvapi-test-key',
					}),
					body: expect.objectContaining({
						model: 'meta/llama-3.1-8b-instruct',
						messages: [{ role: 'user', content: 'Hello' }],
					}),
				}),
			);
		});

		it('should use modelOverride when provided', async () => {
			const node = new NvidiaNim();

			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'resource') return 'chat';
					if (param === 'operation') return 'completions';
					if (param === 'messages.values')
						return [{ role: 'user', content: 'Hi' }];
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'modelOverride') return 'mistralai/mistral-nemo';
					if (param === 'options') return {};
					if (param === 'simplify') return true;
					return undefined;
				}),
				getNode: jest.fn().mockReturnValue({ name: 'NVIDIA NIM', type: 'nvidiaNim' }),
				continueOnFail: jest.fn().mockReturnValue(false),
				helpers: {
					httpRequest: jest.fn().mockResolvedValue({
						choices: [{ message: { content: 'Response' } }],
						usage: {},
					}),
				},
			};

			await node.execute.call(mockContext as Parameters<typeof node.execute>[0]);

			expect(mockContext.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({
						model: 'mistralai/mistral-nemo',
					}),
				}),
			);
		});

		it('should return full response when simplify is false', async () => {
			const node = new NvidiaNim();
			const fullResponse = {
				id: 'chatcmpl-abc123',
				choices: [{ message: { content: 'test' } }],
				usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
				model: 'meta/llama-3.1-8b-instruct',
			};

			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'resource') return 'chat';
					if (param === 'operation') return 'completions';
					if (param === 'messages.values')
						return [{ role: 'user', content: 'Hi' }];
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'modelOverride') return '';
					if (param === 'options') return {};
					if (param === 'simplify') return false;
					return undefined;
				}),
				getNode: jest.fn().mockReturnValue({ name: 'NVIDIA NIM', type: 'nvidiaNim' }),
				continueOnFail: jest.fn().mockReturnValue(false),
				helpers: {
					httpRequest: jest.fn().mockResolvedValue(fullResponse),
				},
			};

			const result = await node.execute.call(mockContext as Parameters<typeof node.execute>[0]);

			expect(result[0][0].json).toMatchObject({
				choices: fullResponse.choices,
				usage: fullResponse.usage,
				id: fullResponse.id,
				model: fullResponse.model,
			});
		});
	});
});
