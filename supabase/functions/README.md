# Edge Functions Configuration

## Available Functions

### ai-chat
AI chat completions using DeepSeek API

**Endpoint:** `https://giyheniqqqwpmetefdxj.supabase.co/functions/v1/ai-chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What is steel grade A36?" }
  ],
  "model": "deepseek-chat",
  "temperature": 0.7,
  "max_tokens": 4000,
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "A36 is a low carbon steel..."
  },
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  },
  "model": "deepseek-chat"
}
```

### ai-embeddings
Generate text embeddings using OpenAI

**Endpoint:** `https://giyheniqqqwpmetefdxj.supabase.co/functions/v1/ai-embeddings`

**Request:**
```json
{
  "input": "A36 hot rolled steel plate",
  "model": "text-embedding-3-small"
}
```

## Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link to your project
```bash
supabase link --project-ref giyheniqqqwpmetefdxj
```

### 4. Set secrets


### 5. Deploy functions
```bash
supabase functions deploy ai-chat
supabase functions deploy ai-embeddings
```

## Testing Locally

Start local development:
```bash
supabase functions serve
```

Test ai-chat:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Environment Variables

The functions use the following environment variables:
- `DEEPSEEK_API_KEY` - DeepSeek API key (required for ai-chat)
- `OPENAI_API_KEY` - OpenAI API key (required for ai-embeddings)

## CORS

Both functions support CORS and can be called from:
- Your frontend application
- External applications
- API clients

## Rate Limiting

Consider implementing rate limiting based on:
- API key usage
- User authentication
- Request frequency

## Security

1. **Never expose API keys in client code**
2. **Use Supabase RLS policies** for data access
3. **Validate input data** in edge functions
4. **Monitor usage** via Supabase dashboard
5. **Set up billing alerts** to avoid unexpected costs

## Monitoring

View function logs:
```bash
supabase functions logs ai-chat
```

Monitor in dashboard:
https://supabase.com/dashboard/project/giyheniqqqwpmetefdxj/functions
