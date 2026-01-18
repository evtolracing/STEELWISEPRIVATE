/**
 * OpenAI Provider Implementation
 * Supports GPT-4, GPT-3.5, O1, and text-embedding models
 */

import OpenAI from 'openai';

export class OpenAIProvider {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
    this.name = 'openai';
  }

  /**
   * Chat completion
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(options) {
    const {
      model = 'gpt-4o-mini',
      messages,
      temperature = 0.7,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stop,
      functions,
      functionCall,
      tools,
      toolChoice,
      responseFormat,
      user,
    } = options;

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stop,
      functions,
      function_call: functionCall,
      tools,
      tool_choice: toolChoice,
      response_format: responseFormat,
      user,
    });

    const choice = completion.choices[0];

    return {
      content: choice.message.content,
      functionCall: choice.message.function_call,
      toolCalls: choice.message.tool_calls,
      finishReason: choice.finish_reason,
      usage: {
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      },
    };
  }

  /**
   * Stream chat completion
   * @param {Object} options - Completion options
   * @returns {AsyncGenerator} Stream of chunks
   */
  async *streamChatCompletion(options) {
    const {
      model = 'gpt-4o-mini',
      messages,
      temperature = 0.7,
      maxTokens,
      topP,
      stop,
      tools,
      toolChoice,
    } = options;

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stop,
      tools,
      tool_choice: toolChoice,
      stream: true,
    });

    let fullContent = '';
    let functionCall = null;
    let toolCalls = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        fullContent += delta.content;
        yield {
          type: 'content',
          content: delta.content,
          fullContent,
          finishReason: chunk.choices[0].finish_reason,
        };
      }

      if (delta?.function_call) {
        if (!functionCall) {
          functionCall = { name: '', arguments: '' };
        }
        if (delta.function_call.name) {
          functionCall.name += delta.function_call.name;
        }
        if (delta.function_call.arguments) {
          functionCall.arguments += delta.function_call.arguments;
        }
      }

      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (!toolCalls[toolCall.index]) {
            toolCalls[toolCall.index] = {
              id: toolCall.id || '',
              type: 'function',
              function: { name: '', arguments: '' },
            };
          }

          if (toolCall.function?.name) {
            toolCalls[toolCall.index].function.name += toolCall.function.name;
          }
          if (toolCall.function?.arguments) {
            toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
          }
        }
      }

      if (chunk.choices[0].finish_reason) {
        yield {
          type: 'complete',
          content: fullContent,
          functionCall,
          toolCalls: toolCalls.filter(Boolean),
          finishReason: chunk.choices[0].finish_reason,
        };
      }
    }
  }

  /**
   * Create embeddings
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} Embeddings response
   */
  async createEmbeddings(options) {
    const {
      model = 'text-embedding-3-small',
      input,
      dimensions,
      user,
    } = options;

    const response = await this.client.embeddings.create({
      model,
      input,
      dimensions,
      user,
    });

    return {
      embeddings: response.data.map(item => ({
        embedding: item.embedding,
        index: item.index,
      })),
      usage: {
        inputTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }

  /**
   * Get provider capabilities
   * @returns {Object} Capabilities
   */
  getCapabilities() {
    return {
      provider: 'openai',
      supports: {
        chat: true,
        streaming: true,
        functionCalling: true,
        tools: true,
        embeddings: true,
        vision: true,
        json: true,
      },
      models: {
        chat: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        reasoning: ['o1-preview', 'o1-mini'],
        embeddings: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
      },
      limits: {
        maxTokens: {
          'gpt-4o': 128000,
          'gpt-4o-mini': 128000,
          'o1-preview': 128000,
          'o1-mini': 128000,
        },
        rateLimit: {
          tier1: { requestsPerMinute: 500, tokensPerMinute: 30000 },
          tier2: { requestsPerMinute: 5000, tokensPerMinute: 450000 },
        },
      },
    };
  }

  /**
   * Test connection
   * @returns {Promise<boolean>} Connection successful
   */
  async testConnection() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error.message);
      return false;
    }
  }
}
