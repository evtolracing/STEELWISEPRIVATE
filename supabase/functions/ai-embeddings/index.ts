import "https://deno.land/x/xhr@0.3.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { input, model = 'text-embedding-3-small' }: EmbeddingRequest = await req.json();

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    if (!input) {
      throw new Error('Input text is required');
    }

    // Note: DeepSeek doesn't have embeddings API yet, so we'll use OpenAI
    // You might want to use OpenAI key for embeddings
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        usage: data.usage,
        model: data.model,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in ai-embeddings function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
