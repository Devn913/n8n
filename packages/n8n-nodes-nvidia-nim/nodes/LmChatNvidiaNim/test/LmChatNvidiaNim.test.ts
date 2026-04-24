import { LmChatNvidiaNim } from '../LmChatNvidiaNim.node';

jest.mock('@n8n/ai-node-sdk', () => ({
	supplyModel: jest.fn().mockReturnValue({ response: { invoke: jest.fn() } }),
}));

import { supplyModel } from '@n8n/ai-node-sdk';
const mockedSupplyModel = jest.mocked(supplyModel);

describe('LmChatNvidiaNim node', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('node description', () => {
		it('should have correct node properties', () => {
			const node = new LmChatNvidiaNim();
			expect(node.description).toMatchObject({
				displayName: 'NVIDIA NIM Chat Model',
				name: 'lmChatNvidiaNim',
				group: ['transform'],
				version: [1],
			});
		});

		it('should require nvidiaNimApi credentials', () => {
			const node = new LmChatNvidiaNim();
			expect(node.description.credentials).toEqual([
				{ name: 'nvidiaNimApi', required: true },
			]);
		});

		it('should output ai_languageModel', () => {
			const node = new LmChatNvidiaNim();
			expect(node.description.outputs).toEqual(['ai_languageModel']);
			expect(node.description.outputNames).toEqual(['Model']);
		});
	});

	describe('supplyData', () => {
		it('should call supplyModel with NVIDIA NIM base URL and API key', async () => {
			const node = new LmChatNvidiaNim();

			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'options') return {};
					return undefined;
				}),
			};

			const result = await node.supplyData.call(
				mockContext as Parameters<typeof node.supplyData>[0],
				0,
			);

			expect(mockContext.getCredentials).toHaveBeenCalledWith('nvidiaNimApi');
			expect(mockedSupplyModel).toHaveBeenCalledWith(
				mockContext,
				expect.objectContaining({
					type: 'openai',
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
					model: 'meta/llama-3.1-8b-instruct',
					maxRetries: 2,
				}),
			);
			expect(result).toEqual({ response: expect.any(Object) });
		});

		it('should pass options to supplyModel', async () => {
			const node = new LmChatNvidiaNim();

			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'options')
						return {
							temperature: 0.5,
							maxTokens: 2000,
							topP: 0.9,
							frequencyPenalty: 0.3,
							presencePenalty: 0.2,
							timeout: 60000,
							maxRetries: 5,
						};
					return undefined;
				}),
			};

			await node.supplyData.call(
				mockContext as Parameters<typeof node.supplyData>[0],
				0,
			);

			expect(mockedSupplyModel).toHaveBeenCalledWith(
				mockContext,
				expect.objectContaining({
					temperature: 0.5,
					maxTokens: 2000,
					topP: 0.9,
					frequencyPenalty: 0.3,
					presencePenalty: 0.2,
					timeout: 60000,
					maxRetries: 5,
				}),
			);
		});

		it('should set response_format in additionalParams when JSON responseFormat is provided', async () => {
			const node = new LmChatNvidiaNim();

			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'options') return { responseFormat: 'json_object' };
					return undefined;
				}),
			};

			await node.supplyData.call(
				mockContext as Parameters<typeof node.supplyData>[0],
				0,
			);

			expect(mockedSupplyModel).toHaveBeenCalledWith(
				mockContext,
				expect.objectContaining({
					additionalParams: { response_format: { type: 'json_object' } },
				}),
			);
		});

		it('should use default base URL when no override provided', async () => {
			const node = new LmChatNvidiaNim();

			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'nvapi-test-key',
					baseUrl: undefined,
				}),
				getNodeParameter: jest.fn().mockImplementation((param: string) => {
					if (param === 'model') return 'meta/llama-3.1-8b-instruct';
					if (param === 'options') return {};
					return undefined;
				}),
			};

			await node.supplyData.call(
				mockContext as Parameters<typeof node.supplyData>[0],
				0,
			);

			expect(mockedSupplyModel).toHaveBeenCalledWith(
				mockContext,
				expect.objectContaining({
					baseUrl: 'https://integrate.api.nvidia.com/v1',
				}),
			);
		});
	});
});
