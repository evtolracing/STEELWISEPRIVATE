# Supabase Setup Guide

## Overview
This project uses Supabase as the backend database and authentication service. Supabase provides a PostgreSQL database with real-time subscriptions, authentication, storage, and edge functions.

## Project Configuration
- **Project ID**: `giyheniqqqwpmetefdxj`
- **Project Name**: `steelwise`
- **Supabase URL**: `https://giyheniqqqwpmetefdxj.supabase.co`

## Prerequisites
1. Node.js >= 20.0.0
2. pnpm >= 8.0.0
3. Access to the Supabase project dashboard

## Environment Setup

### Backend Configuration
1. Copy the example environment file:
   ```bash
   cd src/backend
   cp .env.example .env
   ```

2. Fill in the following required variables in `src/backend/.env`:
   ```env
   SUPABASE_URL="https://giyheniqqqwpmetefdxj.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   SUPABASE_ANON_KEY="your-anon-key-here"
   DATABASE_URL="postgresql://postgres:password@localhost:5432/steelwise"
   ```

### Frontend Configuration
1. Copy the example environment file:
   ```bash
   cd src/frontend
   cp .env.example .env
   ```

2. Fill in the following required variables in `src/frontend/.env`:
   ```env
   VITE_SUPABASE_URL="https://giyheniqqqwpmetefdxj.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

## Getting API Keys

### From Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `steelwise`
3. Navigate to **Settings** → **API**
4. Copy the following keys:
   - **Project URL**: Use this for `SUPABASE_URL`
   - **anon public**: Use this for `SUPABASE_ANON_KEY` (safe for frontend)
   - **service_role**: Use this for `SUPABASE_SERVICE_ROLE_KEY` (backend only, never expose to frontend)

## Database Migrations

The project includes migrations in `supabase/migrations/`:
- `20260204092420_init_schema.sql` - Initial database schema
- `20260205151943_add_drop_tag_engine.sql` - Drop tag engine
- `20260205160000_add_partner_api_layer.sql` - Partner API layer

### Running Migrations
Migrations are automatically applied when connecting to your Supabase project. To manually run migrations or create new ones:

```bash
# Use npx to run Supabase CLI commands
npx supabase migration list
npx supabase migration new your-migration-name
```

## Edge Functions

The project includes Supabase Edge Functions in `supabase/functions/`:
- `ai-chat/` - AI chat assistant endpoint
- `ai-embeddings/` - AI embeddings generation

### Deploying Edge Functions
```bash
npx supabase functions deploy ai-chat
npx supabase functions deploy ai-embeddings
```

## Supabase Client Usage

### Backend (Node.js)
```javascript
import { supabase } from './config/supabaseClient.js';

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');
```

### Frontend (React)
```javascript
import { supabase } from './config/supabaseClient';

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');

// Authentication
const { data: { user }, error } = await supabase.auth.getUser();
```

## Testing Connection

To verify your Supabase connection is working:

```javascript
// Test query
const { data, error } = await supabase
  .from('_prisma_migrations')
  .select('*')
  .limit(1);

if (error) {
  console.error('Connection error:', error);
} else {
  console.log('✅ Successfully connected to Supabase!');
}
```

## Local Development

For local development, you can optionally run a local Supabase instance:

```bash
# Start local Supabase (PostgreSQL, Studio, Edge Functions)
npx supabase start

# Stop local Supabase
npx supabase stop
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Never expose `service_role` key** to the frontend
3. Use **Row Level Security (RLS)** policies in Supabase for data access control
4. Use **anon key** for frontend, it respects RLS policies
5. Store sensitive API keys in **Supabase Secrets** for Edge Functions

## Troubleshooting

### Connection Issues
- Verify your API keys are correct
- Check that your IP is not blocked in Supabase project settings
- Ensure environment variables are loaded correctly

### Package Issues
```bash
# Reinstall Supabase packages
cd src/backend
pnpm add @supabase/supabase-js@latest

cd ../frontend
pnpm add @supabase/supabase-js@latest
```

## Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## Package Versions
- `@supabase/supabase-js`: ^2.95.3 (latest)
- Database: PostgreSQL 15

## Support
For project-specific Supabase questions, refer to the architecture documentation in `archive-design-files/`.
