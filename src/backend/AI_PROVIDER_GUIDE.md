# AI Provider Integration

This document explains how to set up and use the unified AI provider system in SteelWise.

## Overview

SteelWise supports multiple AI/LLM providers:
- **OpenAI** (GPT-4, GPT-3.5, O1, Embeddings)
- **DeepSeek** (Cost-effective alternative with reasoning capabilities)
- **Anthropic** (Claude 3 family)

The system automatically selects the best provider based on the task or falls back to alternatives if the primary fails.

## Setup

### 1. Install Dependencies

```bash
cd src/backend
pnpm add openai @anthropic-ai/sdk
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```env
# OpenAI
OPENAI_API_KEY="sk-..."

# DeepSeek (recommended for cost savings)
DEEPSEEK_API_KEY="sk-..."

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Default provider (auto, openai, deepseek, anthropic)
AI_DEFAULT_PROVIDER="deepseek"

# Enable AI features
AI_ENABLED="true"
```

### 3. Get API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **DeepSeek**: https://platform.deepseek.com/
- **Anthropic**: https://console.anthropic.com/

## API Endpoints

### Get Available Providers

```http
GET /api/ai/providers
```

Returns list of configured providers and their capabilities.

### Chat Completion

```http
POST /api/ai/chat
Content-Type: application/json

{
  "provider": "auto",  // or "openai", "deepseek", "anthropic"
  "task": "chat",      // or "code", "analysis", "reasoning"
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "config": {
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

### Stream Chat Completion (SSE)

```http
POST /api/ai/chat/stream
Content-Type: application/json

{
  "provider": "auto",
  "messages": [...]
}
```

### Create Embeddings

```http
POST /api/ai/embeddings
Content-Type: application/json

{
  "provider": "openai",
  "input": "Text to embed"
}
```

### Test Provider

```http
POST /api/ai/test
Content-Type: application/json

{
  "provider": "deepseek"
}
```

### Get Usage Statistics

```http
GET /api/ai/usage
```

Returns token usage and estimated costs per provider/model.

## Task-Based Provider Selection

When using `provider: "auto"`, the system selects the best provider based on the task:

| Task | Primary Provider | Fallbacks | Use Case |
|------|-----------------|-----------|----------|
| `chat` | DeepSeek | OpenAI, Anthropic | General conversation, customer service |
| `code` | DeepSeek | OpenAI, Anthropic | Code generation, review |
| `reasoning` | DeepSeek Reasoner | O1, Claude Opus | Deep analysis, complex problem solving |
| `analysis` | GPT-4o | DeepSeek, Claude Sonnet | Business insights, data analysis |
| `documents` | Claude Sonnet | GPT-4o, DeepSeek | Document processing with vision |
| `embeddings` | OpenAI | - | Text embeddings for search |
| `quick` | DeepSeek | GPT-4o-mini, Haiku | Fast, low-latency responses |

## Cost Comparison (per 1M tokens)

### Input Tokens
- DeepSeek Chat: $0.14
- GPT-4o-mini: $0.15
- Claude Haiku: $0.25
- GPT-4o: $2.50
- Claude Sonnet: $3.00
- DeepSeek Reasoner: $0.55
- O1-preview: $15.00
- Claude Opus: $15.00

### Output Tokens
- DeepSeek Chat: $0.28
- GPT-4o-mini: $0.60
- Claude Haiku: $1.25
- DeepSeek Reasoner: $2.19
- GPT-4o: $10.00
- Claude Sonnet: $15.00
- O1-preview: $60.00
- Claude Opus: $75.00

## Example Use Cases

### Product Analysis

```javascript
const response = await fetch('/api/ai/analyze-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productSpecs: {
      material: '304 Stainless Steel',
      thickness: '14GA',
      width: '48"',
      length: '120"',
      finish: '2B'
    }
  })
});
```

### Quote Assistant

```javascript
const response = await fetch('/api/ai/quote-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerInfo: { name: 'Acme Corp', tier: 'premium' },
    orderDetails: { items: [...], totalValue: 50000 },
    question: 'What discount can I offer on this order?'
  })
});
```

### Stream Response in Frontend

```javascript
const response = await fetch('/api/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'auto',
    messages: [{ role: 'user', content: 'Explain steel grades' }]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const parsed = JSON.parse(data);
      console.log(parsed.content); // Display chunk
    }
  }
}
```

## Provider-Specific Features

### DeepSeek
- **Reasoning Mode**: Use `deepseek-reasoner` for step-by-step reasoning
- **Cache Tokens**: Automatic prompt caching for repeated requests
- **Cost Effective**: 10x cheaper than GPT-4o

### OpenAI
- **Function Calling**: Support for tools and function definitions
- **Vision**: GPT-4o supports image inputs
- **Embeddings**: Best-in-class embedding models
- **JSON Mode**: Guaranteed JSON responses

### Anthropic
- **Long Context**: 200K token context window
- **Vision**: Claude 3+ supports images
- **Safety**: Strong content moderation

## Error Handling & Fallbacks

The system automatically:
1. Retries failed requests with exponential backoff
2. Falls back to alternative providers on failure
3. Tracks usage and costs per provider/model
4. Handles rate limits gracefully

## Monitoring

Check usage and costs:

```javascript
const stats = await fetch('/api/ai/usage').then(r => r.json());

console.log(stats);
// {
//   "deepseek:deepseek-chat": {
//     requests: 150,
//     totalTokens: 45000,
//     estimatedCost: 0.0126
//   },
//   ...
// }
```

## Best Practices

1. **Use `provider: "auto"`** for most cases - system optimizes based on task
2. **Set `maxTokens`** to prevent runaway costs
3. **Use DeepSeek for high-volume** tasks (80-90% cost savings)
4. **Use GPT-4o for complex analysis** when quality matters most
5. **Use Claude for documents** with images or long context
6. **Monitor usage regularly** via `/api/ai/usage` endpoint
7. **Cache responses** when possible (implement Redis caching)
8. **Use streaming** for better UX on long responses

## Architecture

```
AIProviderService
  ├── AIConfig (model mappings, cost tracking)
  ├── OpenAIProvider
  ├── DeepSeekProvider
  └── AnthropicProvider
```

The unified interface abstracts provider differences and provides:
- Automatic provider selection
- Fallback handling
- Cost tracking
- Usage statistics
- Rate limiting
- Retry logic
