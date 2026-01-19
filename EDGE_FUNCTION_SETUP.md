# Supabase Edge Functions Setup Guide

## Overview

Your DeepSeek API key has been moved from hardcoded `.env` to Supabase Edge Functions with proper secret management.

## Quick Setup

### 1. Install Supabase CLI

```powershell
npm install -g supabase
```

### 2. Login to Supabase

```powershell
supabase login
```

This will open your browser to authenticate.

### 3. Link to Your Project

```powershell
cd c:\Users\evtol\STEELWISEPRIVATE
supabase link --project-ref giyheniqqqwpmetefdxj
```

When prompted for the database password, enter: `Maleah710$$`

### 4. Set Your API Key as a Secret

```powershell
supabase secrets set DEEPSEEK_API_KEY=sk-73e3fba9137f4f78bed16af8099bdb5a
```

This stores the key securely in Supabase (encrypted at rest, only accessible by edge functions).

### 5. Deploy the Edge Functions

```powershell
supabase functions deploy ai-chat
```

Optional - if you want embeddings support:
```powershell
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase functions deploy ai-embeddings
```

## Testing

### Test Locally (Optional)

Start local Supabase:
```powershell
supabase start
```

Set local secret:
```powershell
supabase secrets set --env-file supabase/.env.local DEEPSEEK_API_KEY=sk-73e3fba9137f4f78bed16af8099bdb5a
```

Serve functions locally:
```powershell
supabase functions serve ai-chat
```

### Test Production

Your edge function will be available at:
```
https://giyheniqqqwpmetefdxj.supabase.co/functions/v1/ai-chat
```

Test with curl:
```powershell
curl -i --location --request POST 'https://giyheniqqqwpmetefdxj.supabase.co/functions/v1/ai-chat' `
  --header 'Authorization: Bearer YOUR_ANON_KEY' `
  --header 'Content-Type: application/json' `
  --data '{\"messages\":[{\"role\":\"user\",\"content\":\"What is A36 steel?\"}]}'
```

## Integration with Frontend

Update your frontend AI service to use the edge function:

```javascript
// src/frontend/src/services/aiService.js

const SUPABASE_URL = 'https://giyheniqqqwpmetefdxj.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key'; // Get from Supabase dashboard

export async function chatWithAI(messages) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: 'deepseek-chat',
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  return await response.json();
}
```

## What Changed

### Before (Insecure)
- API key hardcoded in `src/backend/.env`
- Key exposed in repository
- Key visible to anyone with code access

### After (Secure)
- API key stored in Supabase secrets (encrypted)
- Key only accessible by edge functions
- No credentials in code or repository
- Serverless execution (scales automatically)

## Benefits

1. **Security**: API key encrypted at rest, not in code
2. **Scalability**: Edge functions auto-scale globally
3. **Cost**: Pay per invocation, not per server
4. **Latency**: Functions run close to users (global CDN)
5. **Simplicity**: No backend server management needed

## Monitoring

View function logs:
```powershell
supabase functions logs ai-chat --tail
```

Dashboard:
https://supabase.com/dashboard/project/giyheniqqqwpmetefdxj/functions

## Troubleshooting

### Error: "DEEPSEEK_API_KEY is not configured"
Make sure you ran:
```powershell
supabase secrets set DEEPSEEK_API_KEY=sk-73e3fba9137f4f78bed16af8099bdb5a
```

### Error: "Project not linked"
Run:
```powershell
supabase link --project-ref giyheniqqqwpmetefdxj
```

### Error: "Function deployment failed"
Check logs:
```powershell
supabase functions logs ai-chat
```

## Next Steps

1. Run the setup commands above
2. Test the edge function
3. Update frontend to use edge function URL
4. Remove old backend AI routes (optional)
5. Monitor usage in Supabase dashboard

## Getting Your Anon Key

1. Go to: https://supabase.com/dashboard/project/giyheniqqqwpmetefdxj/settings/api
2. Copy the `anon public` key
3. Use it in your frontend Authorization header

This key is safe to use in frontend code - it only allows what your RLS policies permit.
