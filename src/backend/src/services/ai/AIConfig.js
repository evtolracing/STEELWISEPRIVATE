/**
 * AI Configuration Manager
 * Manages model selection, cost tracking, rate limits, and provider preferences
 */

export class AIConfig {
  constructor() {
    this.modelMappings = this.initializeModelMappings();
    this.costRates = this.initializeCostRates();
    this.taskRecommendations = this.initializeTaskRecommendations();
  }

  /**
   * Initialize model mappings for each provider
   * @private
   */
  initializeModelMappings() {
    return {
      openai: {
        chat: {
          fast: 'gpt-4o-mini',
          balanced: 'gpt-4o',
          advanced: 'gpt-4o',
        },
        code: {
          fast: 'gpt-4o-mini',
          balanced: 'gpt-4o',
          advanced: 'gpt-4o',
        },
        analysis: {
          fast: 'gpt-4o-mini',
          balanced: 'gpt-4o',
          advanced: 'o1-preview',
        },
        reasoning: {
          advanced: 'o1-preview',
          balanced: 'o1-mini',
        },
        embeddings: {
          small: 'text-embedding-3-small',
          large: 'text-embedding-3-large',
        },
      },
      deepseek: {
        chat: {
          fast: 'deepseek-chat',
          balanced: 'deepseek-chat',
          advanced: 'deepseek-reasoner',
        },
        code: {
          fast: 'deepseek-chat',
          balanced: 'deepseek-chat',
          advanced: 'deepseek-reasoner',
        },
        analysis: {
          fast: 'deepseek-chat',
          balanced: 'deepseek-reasoner',
          advanced: 'deepseek-reasoner',
        },
        reasoning: {
          balanced: 'deepseek-reasoner',
          advanced: 'deepseek-reasoner',
        },
      },
      anthropic: {
        chat: {
          fast: 'claude-3-haiku-20240307',
          balanced: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022',
        },
        code: {
          fast: 'claude-3-haiku-20240307',
          balanced: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022',
        },
        analysis: {
          fast: 'claude-3-haiku-20240307',
          balanced: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-opus-20240229',
        },
        reasoning: {
          balanced: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-opus-20240229',
        },
      },
    };
  }

  /**
   * Initialize cost rates (per 1M tokens)
   * @private
   */
  initializeCostRates() {
    return {
      openai: {
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4o': { input: 2.50, output: 10.00 },
        'o1-preview': { input: 15.00, output: 60.00 },
        'o1-mini': { input: 3.00, output: 12.00 },
        'text-embedding-3-small': { input: 0.02, output: 0 },
        'text-embedding-3-large': { input: 0.13, output: 0 },
      },
      deepseek: {
        'deepseek-chat': { input: 0.14, output: 0.28 },
        'deepseek-reasoner': { input: 0.55, output: 2.19 },
      },
      anthropic: {
        'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
        'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
        'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      },
    };
  }

  /**
   * Initialize task-based provider recommendations
   * @private
   */
  initializeTaskRecommendations() {
    return {
      // General chat and customer service
      chat: {
        primary: { provider: 'deepseek', model: 'deepseek-chat', reason: 'Cost-effective, fast' },
        fallback: [
          { provider: 'openai', model: 'gpt-4o-mini' },
          { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
          { provider: 'deepseek', model: 'deepseek-chat' },
        ],
      },

      // Code generation and review
      code: {
        primary: { provider: 'deepseek', model: 'deepseek-chat', reason: 'Optimized for code' },
        fallback: [
          { provider: 'openai', model: 'gpt-4o' },
          { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
          { provider: 'deepseek', model: 'deepseek-chat' },
        ],
      },

      // Deep reasoning and analysis
      reasoning: {
        primary: { provider: 'deepseek', model: 'deepseek-reasoner', reason: 'Advanced reasoning' },
        fallback: [
          { provider: 'openai', model: 'o1-preview' },
          { provider: 'anthropic', model: 'claude-3-opus-20240229' },
          { provider: 'deepseek', model: 'deepseek-chat' },
        ],
      },

      // Business analysis and insights
      analysis: {
        primary: { provider: 'deepseek', model: 'deepseek-reasoner', reason: 'Advanced reasoning, cost-effective' },
        fallback: [
          { provider: 'openai', model: 'gpt-4o' },
          { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
          { provider: 'deepseek', model: 'deepseek-chat' },
        ],
      },

      // Document processing and extraction
      documents: {
        primary: { provider: 'deepseek', model: 'deepseek-chat', reason: 'Primary provider available' },
        fallback: [
          { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
          { provider: 'openai', model: 'gpt-4o' },
        ],
      },

      // Text embeddings for search
      embeddings: {
        primary: { provider: 'deepseek', model: 'deepseek-chat', reason: 'Primary provider (no embeddings, uses chat)' },
        fallback: [
          { provider: 'openai', model: 'text-embedding-3-small' },
          { provider: 'openai', model: 'text-embedding-3-large' },
        ],
      },

      // Quick responses (low latency)
      quick: {
        primary: { provider: 'deepseek', model: 'deepseek-chat', reason: 'Fast and cheap' },
        fallback: [
          { provider: 'openai', model: 'gpt-4o-mini' },
          { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
          { provider: 'deepseek', model: 'deepseek-chat' },
        ],
      },
    };
  }

  /**
   * Get model for specific task and provider
   * @param {string} provider - Provider name
   * @param {string} task - Task type
   * @param {string} quality - Quality level (fast, balanced, advanced)
   * @returns {string} Model name
   */
  getModelForTask(provider, task = 'chat', quality = 'balanced') {
    const providerModels = this.modelMappings[provider];

    if (!providerModels) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const taskModels = providerModels[task] || providerModels.chat;
    return taskModels[quality] || taskModels.balanced || Object.values(taskModels)[0];
  }

  /**
   * Get embedding model for provider
   * @param {string} provider - Provider name
   * @returns {string} Embedding model name
   */
  getEmbeddingModel(provider) {
    if (provider === 'openai') {
      return 'text-embedding-3-small';
    }

    // Default to chat model if no embedding support
    return this.getModelForTask(provider, 'chat', 'fast');
  }

  /**
   * Recommend best provider for task
   * @param {string} task - Task type
   * @param {Array} availableProviders - List of available providers
   * @returns {Object|null} Recommendation {provider, model, reason}
   */
  recommendProvider(task, availableProviders) {
    const taskRec = this.taskRecommendations[task] || this.taskRecommendations.chat;

    // Check primary recommendation
    if (availableProviders.includes(taskRec.primary.provider)) {
      return taskRec.primary;
    }

    // Check fallbacks
    for (const fallback of taskRec.fallback || []) {
      if (availableProviders.includes(fallback.provider)) {
        return {
          ...fallback,
          reason: 'Fallback provider',
        };
      }
    }

    // Return first available (prefer DeepSeek)
    if (availableProviders.length > 0) {
      const provider = availableProviders.includes('deepseek') ? 'deepseek' : availableProviders[0];
      return {
        provider,
        model: this.getModelForTask(provider, task),
        reason: 'Default available provider',
      };
    }

    return null;
  }

  /**
   * Calculate cost for API call
   * @param {string} provider - Provider name
   * @param {string} model - Model name
   * @param {Object} usage - Token usage {inputTokens, outputTokens, totalTokens}
   * @returns {number} Cost in USD
   */
  calculateCost(provider, model, usage) {
    const rates = this.costRates[provider]?.[model];

    if (!rates) {
      return 0;
    }

    const inputCost = (usage.inputTokens || 0) * rates.input / 1_000_000;
    const outputCost = (usage.outputTokens || 0) * rates.output / 1_000_000;

    return inputCost + outputCost;
  }

  /**
   * Get all available models for provider
   * @param {string} provider - Provider name
   * @returns {Array} List of models
   */
  getAvailableModels(provider) {
    const providerModels = this.modelMappings[provider];

    if (!providerModels) {
      return [];
    }

    const models = new Set();

    for (const taskModels of Object.values(providerModels)) {
      for (const model of Object.values(taskModels)) {
        models.add(model);
      }
    }

    return Array.from(models);
  }

  /**
   * Get cost rates for provider
   * @param {string} provider - Provider name
   * @returns {Object} Cost rates
   */
  getCostRates(provider) {
    return this.costRates[provider] || {};
  }

  /**
   * Get task recommendations
   * @returns {Object} Task recommendations
   */
  getTaskRecommendations() {
    return this.taskRecommendations;
  }
}
