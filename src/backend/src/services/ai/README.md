# AI Services

Unified AI provider system supporting OpenAI, DeepSeek, and Anthropic.

## Files

- **AIProviderService.js** - Main service with provider registry, fallback handling, and usage tracking
- **AIConfig.js** - Configuration for models, costs, and task-based provider recommendations
- **providers/**
  - **OpenAIProvider.js** - OpenAI integration (GPT-4, embeddings, function calling)
  - **DeepSeekProvider.js** - DeepSeek integration (cost-effective, reasoning mode)
  - **AnthropicProvider.js** - Anthropic integration (Claude 3 family)

## Usage

```javascript
import { aiProvider } from './services/ai/AIProviderService.js';

// Auto-select best provider for task
const response = await aiProvider.getChatCompletion({
  provider: 'auto',
  task: 'chat', // or 'code', 'analysis', 'reasoning'
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  config: {
    temperature: 0.7,
    maxTokens: 1000
  }
});

console.log(response.content);
console.log(`Used ${response.provider} with ${response.model}`);
console.log(`Cost: $${response.usage.totalTokens * 0.00001}`);
```

## Configuration

Add to `.env`:

```env
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-..."
AI_DEFAULT_PROVIDER="deepseek"
```

## Cost Optimization

DeepSeek is recommended as the default provider:
- **10x cheaper** than GPT-4o for similar quality
- **Reasoning mode** for complex analysis
- **Automatic caching** reduces costs further

Example costs (per 1M tokens):
- DeepSeek Chat: $0.14 input / $0.28 output
- GPT-4o: $2.50 input / $10.00 output
- Claude Sonnet: $3.00 input / $15.00 output

## API Routes

See `/api/ai/` endpoints:
- `GET /api/ai/providers` - List available providers
- `POST /api/ai/chat` - Chat completion
- `POST /api/ai/chat/stream` - Streaming response
- `POST /api/ai/embeddings` - Create embeddings
- `POST /api/ai/test` - Test provider connection
- `GET /api/ai/usage` - Usage statistics

Full documentation: `src/backend/AI_PROVIDER_GUIDE.md`
