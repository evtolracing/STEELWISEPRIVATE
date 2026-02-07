/**
 * AI Assistant Route — Database-Aware + General Knowledge
 * 
 * This route:
 * 1. Detects if user is asking about system data (jobs, orders, inventory, etc.)
 * 2. Queries the Supabase/Prisma database for real data
 * 3. Feeds that data to DeepSeek AI for a natural language response
 * 4. Also handles general knowledge questions (steel grades, metallurgy, etc.)
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { aiProvider } from '../services/ai/AIProviderService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Keywords that trigger database queries
const DB_QUERY_PATTERNS = [
  { pattern: /\b(jobs?|work orders?|shop floor)\b/i, type: 'jobs' },
  { pattern: /\b(orders?|sales orders?|purchase orders?)\b/i, type: 'orders' },
  { pattern: /\b(inventor(y|ies)|stock|coils?|on.?hand)\b/i, type: 'inventory' },
  { pattern: /\b(shipments?|shipping|deliveries|delivery|logistics)\b/i, type: 'shipments' },
  { pattern: /\b(quotes?|quoting|pricing)\b/i, type: 'quotes' },
  { pattern: /\b(rfq|request for quote)\b/i, type: 'rfqs' },
  { pattern: /\b(customers?|contacts?|clients?)\b/i, type: 'customers' },
  { pattern: /\b(products?|catalog|grades?|steel grade)\b/i, type: 'products' },
  { pattern: /\b(work.?centers?|machines?|equipment)\b/i, type: 'workcenters' },
  { pattern: /\b(heats?|mill heats?|chemistry)\b/i, type: 'heats' },
  { pattern: /\b(maintenance|pm|preventive|downtime)\b/i, type: 'maintenance' },
  { pattern: /\b(documents?|mtrs?|certs?|certificates?)\b/i, type: 'documents' },
  { pattern: /\b(users?|team|employees?|operators?)\b/i, type: 'users' },
  { pattern: /\b(dashboard|summary|overview|kpi|stats|status)\b/i, type: 'dashboard' },
];

/**
 * Detect what kind of data the user is asking about
 */
function detectQueryType(message) {
  const types = [];
  for (const { pattern, type } of DB_QUERY_PATTERNS) {
    if (pattern.test(message)) {
      types.push(type);
    }
  }
  return types;
}

/**
 * Query database based on detected types
 */
async function queryDatabase(types, userMessage) {
  const results = {};

  for (const type of types) {
    try {
      switch (type) {
        case 'jobs':
          results.jobs = await prisma.job.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, jobNumber: true, operationType: true, status: true,
              priority: true, instructions: true,
              scheduledStart: true, scheduledEnd: true,
              actualStart: true, actualEnd: true,
              createdAt: true,
            },
          });
          results.jobStats = {
            total: await prisma.job.count(),
            scheduled: await prisma.job.count({ where: { status: 'SCHEDULED' } }),
            inProcess: await prisma.job.count({ where: { status: 'IN_PROCESS' } }),
            completed: await prisma.job.count({ where: { status: 'COMPLETED' } }),
          };
          break;

        case 'orders':
          results.orders = await prisma.order.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, orderNumber: true, type: true, status: true,
              totalAmount: true, currency: true,
              createdAt: true, requiredDate: true,
            },
          });
          results.orderStats = {
            total: await prisma.order.count(),
          };
          break;

        case 'inventory':
          results.coils = await prisma.coil.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, coilNumber: true, status: true,
              thickness: true, width: true, weight: true,
              createdAt: true,
            },
          });
          results.inventoryStats = {
            totalCoils: await prisma.coil.count(),
          };
          break;

        case 'shipments':
          results.shipments = await prisma.shipment.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, shipmentNumber: true, status: true,
              carrier: true, trackingNumber: true,
              shipDate: true, deliveryDate: true,
              createdAt: true,
            },
          });
          results.shipmentStats = {
            total: await prisma.shipment.count(),
          };
          break;

        case 'quotes':
          results.quotes = await prisma.quote.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, quoteNumber: true, status: true,
              totalAmount: true, currency: true,
              validUntil: true, createdAt: true,
            },
          });
          results.quoteStats = {
            total: await prisma.quote.count(),
          };
          break;

        case 'rfqs':
          results.rfqs = await prisma.rFQ.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, rfqNumber: true, status: true,
              source: true, urgency: true,
              createdAt: true,
            },
          });
          break;

        case 'products':
          results.products = await prisma.product.findMany({
            take: 20,
            select: {
              id: true, sku: true, name: true, form: true,
              thicknessMin: true, thicknessMax: true,
              widthMin: true, widthMax: true,
              isActive: true,
            },
          });
          results.grades = await prisma.grade.findMany({
            take: 20,
            select: {
              id: true, name: true, standard: true, type: true,
            },
          });
          break;

        case 'workcenters':
          results.workCenters = await prisma.workCenter.findMany({
            take: 20,
            select: {
              id: true, name: true, type: true, status: true,
              capabilities: true,
            },
          });
          break;

        case 'heats':
          results.heats = await prisma.heat.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, heatNumber: true, millName: true,
              createdAt: true,
            },
          });
          break;

        case 'customers':
          results.customers = await prisma.organization.findMany({
            take: 20,
            orderBy: { name: 'asc' },
            select: {
              id: true, code: true, name: true, type: true,
              address: true, city: true, state: true, postalCode: true, country: true,
              phone: true, email: true, isActive: true,
              createdAt: true,
              _count: {
                select: {
                  ordersAsBuyer: true,
                  rfqs: true,
                  users: true,
                },
              },
            },
          });
          results.customerStats = {
            total: await prisma.organization.count(),
            active: await prisma.organization.count({ where: { isActive: true } }),
            inactive: await prisma.organization.count({ where: { isActive: false } }),
          };
          break;

        case 'users':
          results.users = await prisma.user.findMany({
            take: 15,
            select: {
              id: true, email: true, firstName: true, lastName: true,
              role: true, title: true, phone: true,
              isActive: true, lastLoginAt: true,
              organization: { select: { name: true } },
            },
          });
          break;

        case 'maintenance':
          results.maintenanceOrders = await prisma.maintenanceOrder.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, orderNumber: true, type: true, status: true,
              priority: true, description: true,
              scheduledDate: true, createdAt: true,
            },
          });
          break;

        case 'documents':
          results.documents = await prisma.document.findMany({
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, title: true, type: true,
              createdAt: true,
            },
          });
          break;

        case 'dashboard':
          results.dashboardStats = {
            jobs: {
              total: await prisma.job.count(),
              scheduled: await prisma.job.count({ where: { status: 'SCHEDULED' } }),
              inProcess: await prisma.job.count({ where: { status: 'IN_PROCESS' } }),
              completed: await prisma.job.count({ where: { status: 'COMPLETED' } }),
            },
            orders: { total: await prisma.order.count() },
            coils: { total: await prisma.coil.count() },
            shipments: { total: await prisma.shipment.count() },
            quotes: { total: await prisma.quote.count() },
          };
          break;
      }
    } catch (err) {
      console.warn(`⚠️  DB query failed for "${type}":`, err.message);
      results[`${type}_error`] = err.message;
    }
  }

  return results;
}

/** Build system prompt with optional DB context */
function buildSystemPrompt(dbContext) {
  return `You are SteelWise AI, the intelligent voice assistant for a steel manufacturing & distribution ERP.

CAPABILITIES:
- Query live system data: jobs, orders, inventory, shipments, quotes, RFQs, products, grades, work centers, heats, customers, users, maintenance, documents
- Answer general knowledge: steel grades, metallurgy, manufacturing processes, industry standards
- Help with calculations: coil weights, material dimensions, pricing

RESPONSE RULES:
- Keep answers SHORT and CONVERSATIONAL — you are a voice assistant, users hear this spoken aloud
- Use plain language, avoid excessive formatting or markdown
- Do NOT use bullet points with asterisks or dashes — just use natural sentences
- For data: summarize counts and key items, don't dump raw JSON
- For lists: mention top 3-5 items, say "and X more" for the rest
- Always be helpful, professional, and concise
- If data is empty, say so honestly and suggest the user might need to add records
- Dates should be in a natural format like "February 5th" not ISO strings
${dbContext}`;
}

/**
 * POST /api/ai/assistant
 * Non-streaming version (kept for compatibility)
 */
router.post('/', async (req, res) => {
  try {
    const { messages: userMessages = [], config = {} } = req.body;

    if (!userMessages.length) {
      return res.status(400).json({ error: 'Messages required' });
    }

    const lastUserMsg = userMessages.filter(m => m.role === 'user').pop()?.content || '';
    const queryTypes = detectQueryType(lastUserMsg);
    let dbContext = '';

    if (queryTypes.length > 0) {
      console.log(`🔍 AI Assistant: querying DB for types: [${queryTypes.join(', ')}]`);
      const dbData = await queryDatabase(queryTypes, lastUserMsg);
      if (Object.keys(dbData).length > 0) {
        dbContext = `\n\n--- LIVE DATABASE RESULTS ---\n${JSON.stringify(dbData, null, 2)}\n--- END DATABASE RESULTS ---\n`;
      }
    }

    const apiMessages = [
      { role: 'system', content: buildSystemPrompt(dbContext) },
      ...userMessages.slice(-10),
    ];

    await aiProvider.ensureInitialized();

    const response = await aiProvider.getChatCompletion({
      provider: 'auto',
      task: 'chat',
      messages: apiMessages,
      config: { temperature: config.temperature || 0.7, maxTokens: config.maxTokens || 800 },
    });

    const content = response.choices?.[0]?.message?.content
      || response.message?.content
      || response.content
      || 'I processed your request but got no response.';

    res.json({ content, queryTypes, hasDbData: queryTypes.length > 0 });
  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/assistant/stream
 * SSE streaming version — sends text chunks as they arrive from DeepSeek
 * 
 * SSE events:
 *   meta      — { queryTypes, hasDbData }
 *   delta     — { text }   (incremental text chunk)
 *   done      — { content } (full assembled text)
 *   error     — { error }
 */
router.post('/stream', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendSSE = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { messages: userMessages = [], config = {} } = req.body;

    if (!userMessages.length) {
      sendSSE('error', { error: 'Messages required' });
      res.end();
      return;
    }

    const lastUserMsg = userMessages.filter(m => m.role === 'user').pop()?.content || '';
    const queryTypes = detectQueryType(lastUserMsg);
    let dbContext = '';

    if (queryTypes.length > 0) {
      console.log(`🔍 AI Assistant (stream): querying DB for [${queryTypes.join(', ')}]`);
      const dbData = await queryDatabase(queryTypes, lastUserMsg);
      if (Object.keys(dbData).length > 0) {
        dbContext = `\n\n--- LIVE DATABASE RESULTS ---\n${JSON.stringify(dbData, null, 2)}\n--- END DATABASE RESULTS ---\n`;
      }
    }

    // Send metadata first so frontend knows about DB query
    sendSSE('meta', { queryTypes, hasDbData: queryTypes.length > 0 });

    const apiMessages = [
      { role: 'system', content: buildSystemPrompt(dbContext) },
      ...userMessages.slice(-10),
    ];

    await aiProvider.ensureInitialized();

    let fullContent = '';

    const stream = aiProvider.streamChatCompletion({
      provider: 'auto',
      task: 'chat',
      messages: apiMessages,
      config: { temperature: config.temperature || 0.7, maxTokens: config.maxTokens || 800 },
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        const text = chunk.content || '';
        fullContent += text;
        sendSSE('delta', { text });
      } else if (chunk.type === 'complete') {
        // Stream finished
      }
    }

    sendSSE('done', { content: fullContent });
    res.end();

  } catch (error) {
    console.error('❌ AI Assistant stream error:', error);
    sendSSE('error', { error: error.message });
    res.end();
  }
});

export default router;
