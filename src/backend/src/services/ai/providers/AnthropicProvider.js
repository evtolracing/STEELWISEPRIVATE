/**
 * Anthropic Provider Implementation
 * Supports Claude 3 family (Opus, Sonnet, Haiku)
 */

import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider {
  constructor(apiKey) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.name = 'anthropic';
  }

  /**
   * Chat completion
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} Completion response
   */
  async chatCompletion(options) {
    const {
      model = 'claude-3-5-sonnet-20241022',
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      topP,
      topK,
      stop,
      system,
    } = options;

    // Convert OpenAI-style messages to Anthropic format
    const { systemMessage, conversationMessages } = this.convertMessages(messages, system);

    const completion = await this.client.messages.create({
      model,
      messages: conversationMessages,
      system: systemMessage,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      top_k: topK,
      stop_sequences: stop,
    });

    // Extract text content
    const textContent = completion.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: textContent,
      finishReason: completion.stop_reason,
      stopSequence: completion.stop_sequence,
      usage: {
        inputTokens: completion.usage.input_tokens,
        outputTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.input_tokens + completion.usage.output_tokens,
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
      model = 'claude-3-5-sonnet-20241022',
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      topP,
      topK,
      stop,
      system,
    } = options;

    const { systemMessage, conversationMessages } = this.convertMessages(messages, system);

    const stream = await this.client.messages.create({
      model,
      messages: conversationMessages,
      system: systemMessage,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      top_k: topK,
      stop_sequences: stop,
      stream: true,
    });

    let fullContent = '';
    let usage = null;

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        // New content block started
        continue;
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullContent += text;

          yield {
            type: 'content',
            content: text,
            fullContent,
          };
        }
      }

      if (event.type === 'message_delta') {
        if (event.delta.stop_reason) {
          yield {
            type: 'complete',
            content: fullContent,
            finishReason: event.delta.stop_reason,
            stopSequence: event.delta.stop_sequence,
            usage: event.usage,
          };
        }
      }

      if (event.type === 'message_stop') {
        // Stream complete
        continue;
      }
    }
  }

  /**
   * Create embeddings (Not supported by Anthropic)
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} Embeddings response
   */
  async createEmbeddings(options) {
    throw new Error('Anthropic does not support embedding models. Use OpenAI provider for embeddings.');
  }

  /**
   * Convert OpenAI-style messages to Anthropic format
   * @private
   */
  convertMessages(messages, systemOverride) {
    let systemMessage = systemOverride || '';
    const conversationMessages = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Extract system message
        systemMessage += (systemMessage ? '\n\n' : '') + msg.content;
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        conversationMessages.push({
          role: msg.role,
          content: msg.content,
        });
      } else if (msg.role === 'function' || msg.role === 'tool') {
        // Convert function/tool responses to user messages
        conversationMessages.push({
          role: 'user',
          content: `Function result: ${msg.content}`,
        });
      }
    }

    return { systemMessage, conversationMessages };
  }

  /**
   * Get provider capabilities
   * @returns {Object} Capabilities
   */
  getCapabilities() {
    return {
      provider: 'anthropic',
      supports: {
        chat: true,
        streaming: true,
        functionCalling: false,
        tools: true, // Claude 3+ supports tool use
        embeddings: false,
        vision: true, // Claude 3+ supports vision
        json: false, // No native JSON mode
      },
      models: {
        chat: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ],
      },
      limits: {
        maxTokens: {
          'claude-3-opus-20240229': 200000,
          'claude-3-5-sonnet-20241022': 200000,
          'claude-3-sonnet-20240229': 200000,
          'claude-3-haiku-20240307': 200000,
        },
        maxOutputTokens: {
          default: 4096,
          max: 8192,
        },
      },
      pricing: {
        'claude-3-opus-20240229': {
          input: 15.00,
          output: 75.00,
        },
        'claude-3-5-sonnet-20241022': {
          input: 3.00,
          output: 15.00,
        },
        'claude-3-sonnet-20240229': {
          input: 3.00,
          output: 15.00,
        },
        'claude-3-haiku-20240307': {
          input: 0.25,
          output: 1.25,
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
      const completion = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return !!completion.content[0];
    } catch (error) {
      console.error('Anthropic connection test failed:', error.message);
      return false;
    }
  }
}
