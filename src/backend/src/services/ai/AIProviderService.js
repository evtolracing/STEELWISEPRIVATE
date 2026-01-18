/**
 * Unified AI Provider Service
 * Abstract interface for multiple LLM providers (OpenAI, DeepSeek, Anthropic, etc.)
 * Handles provider selection, fallback, rate limiting, and cost tracking
 */

import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { DeepSeekProvider } from './providers/DeepSeekProvider.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { AIConfig } from './AIConfig.js';

export class AIProviderService {
  constructor() {
    this.providers = new Map();
    this.config = new AIConfig();
    this.usageStats = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all configured AI providers
   */
  initializeProviders() {
    // Register available providers
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
      console.log('✅ OpenAI provider initialized');
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', new DeepSeekProvider(process.env.DEEPSEEK_API_KEY));
      console.log('✅ DeepSeek provider initialized');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
      console.log('✅ Anthropic provider initialized');
    }

    if (this.providers.size === 0) {
      console.warn('⚠️  No AI providers configured. Add API keys to .env');
    }
  }

  /**
   * Get chat completion from specified provider or auto-select best provider
   * @param {Object} options - Chat completion options
   * @param {string} options.provider - Provider name (openai, deepseek, anthropic) or 'auto'
   * @param {string} options.task - Task type (chat, code, analysis, reasoning, etc.)
   * @param {Array} options.messages - Chat messages
   * @param {string} options.model - Specific model override
   * @param {Object} options.config - Additional config (temperature, maxTokens, etc.)
   * @returns {Promise<Object>} Chat completion response
   */
  async getChatCompletion(options) {
    const {
      provider = 'auto',
      task = 'chat',
      messages,
      model,
      config = {},
    } = options;

    // Select provider and model
    const { selectedProvider, selectedModel } = this.selectProvider(provider, task, model);

    if (!selectedProvider) {
      throw new Error('No AI provider available. Configure API keys in .env');
    }

    try {
      // Get provider instance
      const providerInstance = this.providers.get(selectedProvider);

      // Call provider with retry logic
      const response = await this.withRetry(
        () => providerInstance.chatCompletion({
          model: selectedModel,
          messages,
          ...config,
        }),
        selectedProvider
      );

      // Track usage
      this.trackUsage(selectedProvider, selectedModel, response.usage);

      return {
        provider: selectedProvider,
        model: selectedModel,
        content: response.content,
        usage: response.usage,
        finishReason: response.finishReason,
      };
    } catch (error) {
      console.error(`Error with ${selectedProvider}:`, error.message);

      // Try fallback provider if available
      if (provider === 'auto') {
        return this.tryFallback(options, selectedProvider);
      }

      throw error;
    }
  }

  /**
   * Get embeddings from specified provider
   * @param {Object} options - Embedding options
   * @param {string} options.provider - Provider name or 'auto'
   * @param {string|Array} options.input - Text or array of texts to embed
   * @param {string} options.model - Specific embedding model
   * @returns {Promise<Object>} Embeddings response
   */
  async getEmbeddings(options) {
    const {
      provider = 'auto',
      input,
      model,
    } = options;

    // Select provider for embeddings
    const selectedProvider = this.selectEmbeddingProvider(provider);

    if (!selectedProvider) {
      throw new Error('No embedding provider available');
    }

    const providerInstance = this.providers.get(selectedProvider);
    const selectedModel = model || this.config.getEmbeddingModel(selectedProvider);

    try {
      const response = await this.withRetry(
        () => providerInstance.createEmbeddings({
          model: selectedModel,
          input,
        }),
        selectedProvider
      );

      this.trackUsage(selectedProvider, selectedModel, response.usage);

      return {
        provider: selectedProvider,
        model: selectedModel,
        embeddings: response.embeddings,
        usage: response.usage,
      };
    } catch (error) {
      console.error(`Embedding error with ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  /**
   * Stream chat completion
   * @param {Object} options - Chat options
   * @returns {AsyncGenerator} Stream of response chunks
   */
  async *streamChatCompletion(options) {
    const {
      provider = 'auto',
      task = 'chat',
      messages,
      model,
      config = {},
    } = options;

    const { selectedProvider, selectedModel } = this.selectProvider(provider, task, model);

    if (!selectedProvider) {
      throw new Error('No AI provider available');
    }

    const providerInstance = this.providers.get(selectedProvider);

    try {
      const stream = providerInstance.streamChatCompletion({
        model: selectedModel,
        messages,
        ...config,
      });

      let totalTokens = 0;

      for await (const chunk of stream) {
        totalTokens += chunk.usage?.totalTokens || 0;
        yield {
          provider: selectedProvider,
          model: selectedModel,
          ...chunk,
        };
      }

      // Track final usage
      this.trackUsage(selectedProvider, selectedModel, { totalTokens });
    } catch (error) {
      console.error(`Stream error with ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  /**
   * Select best provider and model for task
   * @private
   */
  selectProvider(provider, task, modelOverride) {
    // If specific provider requested
    if (provider !== 'auto' && this.providers.has(provider)) {
      return {
        selectedProvider: provider,
        selectedModel: modelOverride || this.config.getModelForTask(provider, task),
      };
    }

    // Auto-select based on task and availability
    const recommendation = this.config.recommendProvider(task, Array.from(this.providers.keys()));

    if (!recommendation) {
      return { selectedProvider: null, selectedModel: null };
    }

    return {
      selectedProvider: recommendation.provider,
      selectedModel: modelOverride || recommendation.model,
    };
  }

  /**
   * Select embedding provider
   * @private
   */
  selectEmbeddingProvider(provider) {
    if (provider !== 'auto' && this.providers.has(provider)) {
      return provider;
    }

    // Prefer OpenAI for embeddings (best support)
    if (this.providers.has('openai')) return 'openai';
    if (this.providers.has('deepseek')) return 'deepseek';

    return null;
  }

  /**
   * Try fallback provider on failure
   * @private
   */
  async tryFallback(options, failedProvider) {
    const availableProviders = Array.from(this.providers.keys())
      .filter(p => p !== failedProvider);

    if (availableProviders.length === 0) {
      throw new Error('No fallback provider available');
    }

    console.log(`🔄 Falling back to alternative provider...`);

    return this.getChatCompletion({
      ...options,
      provider: availableProviders[0],
    });
  }

  /**
   * Retry logic with exponential backoff
   * @private
   */
  async withRetry(fn, providerName, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (400-499)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (i < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 10000);
          console.log(`⚠️  Retry ${i + 1}/${maxRetries} for ${providerName} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Track usage statistics
   * @private
   */
  trackUsage(provider, model, usage) {
    const key = `${provider}:${model}`;

    if (!this.usageStats.has(key)) {
      this.usageStats.set(key, {
        requests: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
      });
    }

    const stats = this.usageStats.get(key);
    stats.requests++;
    stats.totalTokens += usage.totalTokens || 0;
    stats.inputTokens += usage.inputTokens || 0;
    stats.outputTokens += usage.outputTokens || 0;
    stats.estimatedCost += this.config.calculateCost(provider, model, usage);
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage stats by provider and model
   */
  getUsageStats() {
    const stats = {};

    for (const [key, value] of this.usageStats.entries()) {
      stats[key] = { ...value };
    }

    return stats;
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.usageStats.clear();
  }

  /**
   * Get available providers
   * @returns {Array} List of configured providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is available
   * @param {string} providerName - Provider to check
   * @returns {boolean}
   */
  isProviderAvailable(providerName) {
    return this.providers.has(providerName);
  }

  /**
   * Get provider capabilities
   * @param {string} providerName - Provider name
   * @returns {Object} Capabilities
   */
  getProviderCapabilities(providerName) {
    const provider = this.providers.get(providerName);
    return provider ? provider.getCapabilities() : null;
  }
}

// Export singleton instance
export const aiProvider = new AIProviderService();
