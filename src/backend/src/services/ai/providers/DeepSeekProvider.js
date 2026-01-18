/**
 * DeepSeek Provider Implementation
 * Supports DeepSeek Chat and DeepSeek Reasoner models
 * DeepSeek API is OpenAI-compatible
 */

import OpenAI from 'openai';

export class DeepSeekProvider {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });
    this.name = 'deepseek';
  }

  /**
   * Chat completion
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(options) {
    const {
      model = 'deepseek-chat',
      messages,
      temperature = 0.7,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stop,
      responseFormat,
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
      response_format: responseFormat,
      stream: false,
    });

    const choice = completion.choices[0];

    return {
      content: choice.message.content,
      finishReason: choice.finish_reason,
      usage: {
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
        // DeepSeek-specific: reasoning tokens
        cacheTokens: completion.usage.prompt_cache_hit_tokens || 0,
        cacheMissTokens: completion.usage.prompt_cache_miss_tokens || 0,
      },
      // Include reasoning content if available (for deepseek-reasoner)
      reasoning: choice.message.reasoning_content,
    };
  }

  /**
   * Stream chat completion
   * @param {Object} options - Completion options
   * @returns {AsyncGenerator} Stream of chunks
   */
  async *streamChatCompletion(options) {
    const {
      model = 'deepseek-chat',
      messages,
      temperature = 0.7,
      maxTokens,
      topP,
      stop,
      responseFormat,
    } = options;

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stop,
      response_format: responseFormat,
      stream: true,
    });

    let fullContent = '';
    let fullReasoning = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle reasoning content (for deepseek-reasoner)
      if (delta?.reasoning_content) {
        fullReasoning += delta.reasoning_content;
        yield {
          type: 'reasoning',
          reasoning: delta.reasoning_content,
          fullReasoning,
        };
      }

      // Handle main content
      if (delta?.content) {
        fullContent += delta.content;
        yield {
          type: 'content',
          content: delta.content,
          fullContent,
          finishReason: chunk.choices[0].finish_reason,
        };
      }

      if (chunk.choices[0].finish_reason) {
        yield {
          type: 'complete',
          content: fullContent,
          reasoning: fullReasoning,
          finishReason: chunk.choices[0].finish_reason,
          usage: chunk.usage,
        };
      }
    }
  }

  /**
   * Create embeddings (if supported in future)
   * Currently uses chat model for semantic tasks
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} Embeddings response
   */
  async createEmbeddings(options) {
    throw new Error('DeepSeek does not currently support dedicated embedding models. Use OpenAI provider for embeddings.');
  }

  /**
   * Get provider capabilities
   * @returns {Object} Capabilities
   */
  getCapabilities() {
    return {
      provider: 'deepseek',
      supports: {
        chat: true,
        streaming: true,
        functionCalling: false, // Not supported yet
        tools: false,
        embeddings: false,
        vision: false,
        json: true,
        reasoning: true, // Unique to deepseek-reasoner
      },
      models: {
        chat: ['deepseek-chat'],
        reasoning: ['deepseek-reasoner'],
      },
      limits: {
        maxTokens: {
          'deepseek-chat': 64000,
          'deepseek-reasoner': 64000,
        },
        contextWindow: {
          'deepseek-chat': 64000,
          'deepseek-reasoner': 64000,
        },
      },
      pricing: {
        'deepseek-chat': {
          input: 0.14, // per 1M tokens
          output: 0.28,
          cache_hit: 0.014,
        },
        'deepseek-reasoner': {
          input: 0.55,
          output: 2.19,
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
      const completion = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return !!completion.choices[0];
    } catch (error) {
      console.error('DeepSeek connection test failed:', error.message);
      return false;
    }
  }
}
