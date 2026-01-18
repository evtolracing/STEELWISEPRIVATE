/**
 * AI API Routes
 * Endpoints for testing and using AI providers (OpenAI, DeepSeek, Anthropic)
 */

import express from 'express';
import { aiProvider } from '../services/ai/AIProviderService.js';

const router = express.Router();

/**
 * GET /api/ai/providers
 * Get list of available AI providers and their capabilities
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = aiProvider.getAvailableProviders();

    const capabilities = {};
    for (const provider of providers) {
      capabilities[provider] = aiProvider.getProviderCapabilities(provider);
    }

    res.json({
      providers,
      capabilities,
      defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'auto',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/usage
 * Get AI usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const stats = aiProvider.getUsageStats();

    res.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/chat
 * Send chat completion request
 * 
 * Body:
 * {
 *   provider: 'auto' | 'openai' | 'deepseek' | 'anthropic',
 *   task: 'chat' | 'code' | 'analysis' | 'reasoning',
 *   messages: [{role: 'user', content: '...'}],
 *   model?: string (optional model override),
 *   config?: {temperature, maxTokens, etc.}
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      provider = 'auto',
      task = 'chat',
      messages,
      model,
      config = {},
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await aiProvider.getChatCompletion({
      provider,
      task,
      messages,
      model,
      config,
    });

    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/chat/stream
 * Stream chat completion response (Server-Sent Events)
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const {
      provider = 'auto',
      task = 'chat',
      messages,
      model,
      config = {},
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = aiProvider.streamChatCompletion({
      provider,
      task,
      messages,
      model,
      config,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/ai/embeddings
 * Create embeddings for text
 * 
 * Body:
 * {
 *   provider: 'auto' | 'openai',
 *   input: string | string[],
 *   model?: string
 * }
 */
router.post('/embeddings', async (req, res) => {
  try {
    const {
      provider = 'auto',
      input,
      model,
    } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const response = await aiProvider.getEmbeddings({
      provider,
      input,
      model,
    });

    res.json(response);
  } catch (error) {
    console.error('AI embeddings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/test
 * Test AI provider connection
 */
router.post('/test', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider name is required' });
    }

    if (!aiProvider.isProviderAvailable(provider)) {
      return res.status(404).json({ 
        error: `Provider '${provider}' is not configured. Add API key to .env` 
      });
    }

    // Test with simple message
    const response = await aiProvider.getChatCompletion({
      provider,
      task: 'chat',
      messages: [
        { role: 'user', content: 'Say "Hello from SteelWise!" in exactly that format.' }
      ],
      config: {
        maxTokens: 50,
        temperature: 0,
      },
    });

    res.json({
      success: true,
      provider: response.provider,
      model: response.model,
      response: response.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/analyze-product
 * AI-powered product analysis and recommendations
 * Example use case: Analyze material specs and suggest alternatives
 */
router.post('/analyze-product', async (req, res) => {
  try {
    const { productSpecs, task = 'analyze' } = req.body;

    if (!productSpecs) {
      return res.status(400).json({ error: 'Product specs are required' });
    }

    const systemPrompt = `You are a steel industry expert assistant for SteelWise ERP. 
Analyze material specifications and provide insights about:
- Material properties and applications
- Alternative materials/grades
- Processing requirements
- Quality considerations
- Cost optimization opportunities

Respond in JSON format with structured analysis.`;

    const response = await aiProvider.getChatCompletion({
      provider: 'auto',
      task: 'analysis',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this product: ${JSON.stringify(productSpecs)}` }
      ],
      config: {
        temperature: 0.3,
        maxTokens: 1000,
      },
    });

    res.json({
      analysis: response.content,
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Product analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/quote-assistant
 * AI assistant for quote generation and pricing suggestions
 */
router.post('/quote-assistant', async (req, res) => {
  try {
    const { customerInfo, orderDetails, question } = req.body;

    const systemPrompt = `You are an AI sales assistant for SteelWise ERP.
Help with quote generation, pricing strategies, and customer service.
Consider:
- Customer history and relationship
- Market conditions
- Material costs
- Competition
- Margin targets

Provide helpful, accurate, and professional advice.`;

    const userMessage = `
Customer: ${JSON.stringify(customerInfo)}
Order: ${JSON.stringify(orderDetails)}
Question: ${question}
`;

    const response = await aiProvider.getChatCompletion({
      provider: 'auto',
      task: 'chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      config: {
        temperature: 0.7,
        maxTokens: 800,
      },
    });

    res.json({
      suggestion: response.content,
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Quote assistant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/ai/usage
 * Reset usage statistics
 */
router.delete('/usage', async (req, res) => {
  try {
    aiProvider.resetUsageStats();
    res.json({ message: 'Usage statistics reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
