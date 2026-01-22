# DeepSeek API Setup Guide

DeepSeek is the **primary AI provider** for SteelWise, offering 10x cost savings compared to OpenAI with comparable performance.

## Quick Setup

### 1. Get Your DeepSeek API Key

1. Visit: https://platform.deepseek.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Configure Backend

Add to `src/backend/.env`:

```bash
DEEPSEEK_API_KEY="sk-your-actual-key-here"
AI_DEFAULT_PROVIDER="deepseek"
AI_ENABLED="true"
```

### 3. Test Your Setup

```bash
cd src/backend
node test-ai-providers.js
```

You should see:
```
✅ DeepSeek provider initialized (PRIMARY)
🔍 Testing DEEPSEEK
✓ Capabilities: ...
✓ Chat completion successful
```

## Usage in Code

### Automatic (Recommended)

The system automatically uses DeepSeek when `provider: 'auto'`:

```javascript
const response = await aiProvider.getChatCompletion({
  provider: 'auto',  // Uses DeepSeek by default
  task: 'chat',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Explicit

Force DeepSeek specifically:

```javascript
const response = await aiProvider.getChatCompletion({
  provider: 'deepseek',
  task: 'reasoning',  // Uses deepseek-reasoner for complex tasks
  messages: [{ role: 'user', content: 'Analyze this data...' }],
});
```

## Available Models

DeepSeek offers two main models:

1. **deepseek-chat** (Fast, general-purpose)
   - Used for: chat, code, quick tasks
   - Cost: ~$0.14 per 1M input tokens
   - Speed: Fast responses

2. **deepseek-reasoner** (Advanced reasoning)
   - Used for: analysis, complex reasoning, planning
   - Cost: ~$0.55 per 1M input tokens
   - Quality: Superior for complex tasks

## Fallback Chain

If DeepSeek is unavailable, the system automatically falls back to:

1. **DeepSeek** (primary)
2. **OpenAI** (if `OPENAI_API_KEY` is set)
3. **Anthropic** (if `ANTHROPIC_API_KEY` is set)

## API Endpoints

All AI endpoints default to DeepSeek:

```bash
# Chat completion
POST /api/ai/chat
{
  "provider": "auto",  # Uses DeepSeek
  "messages": [{"role": "user", "content": "Hello"}]
}

# Streaming chat
POST /api/ai/chat/stream
{
  "provider": "auto",
  "messages": [...]
}

# Check available providers
GET /api/ai/providers

# View usage stats
GET /api/ai/usage
```

## Cost Comparison

| Provider | Model | Input (1M tokens) | Output (1M tokens) |
|----------|-------|-------------------|-------------------|
| DeepSeek | deepseek-chat | $0.14 | $0.28 |
| DeepSeek | deepseek-reasoner | $0.55 | $2.19 |
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| Anthropic | claude-3.5-sonnet | $3.00 | $15.00 |

**DeepSeek saves ~10x on costs while maintaining excellent quality!**

## Troubleshooting

### "No AI providers configured"

- Check that `DEEPSEEK_API_KEY` is set in `.env`
- Restart the backend server after adding the key
- Verify the key is valid at https://platform.deepseek.com/

### "Provider deepseek is not available"

- The API key may be invalid or expired
- Check for typos in the `.env` file
- Ensure there are no extra spaces or quotes

### Rate Limiting

DeepSeek has generous rate limits, but if you hit them:
- The system automatically retries with exponential backoff
- Falls back to OpenAI/Anthropic if configured
- Check usage at https://platform.deepseek.com/usage

## Production Deployment

For production, also configure:

1. **Supabase Edge Functions** (for frontend AI features):
   ```bash
   supabase secrets set DEEPSEEK_API_KEY=sk-your-key
   ```

2. **Environment variables** in your hosting platform (Vercel, Railway, etc.)

3. **Monitoring**: Track usage via `/api/ai/usage` endpoint

## Support

- DeepSeek Docs: https://platform.deepseek.com/docs
- API Reference: https://platform.deepseek.com/api-docs
- SteelWise AI Guide: `./AI_PROVIDER_GUIDE.md`
