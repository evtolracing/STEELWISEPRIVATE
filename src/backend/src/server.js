import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gradeRoutes from './routes/grades.js';
import productRoutes from './routes/products.js';
import heatRoutes from './routes/heats.js';
import coilRoutes from './routes/coils.js';
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/orders.js';
import workOrderRoutes from './routes/workOrders.js';
import shipmentRoutes from './routes/shipments.js';
import dashboardRoutes from './routes/dashboard.js';
import customerRoutes from './routes/customers.js';
import rfqRoutes from './routes/rfqs.js';
import quoteRoutes from './routes/quotes.js';
import workCenterRoutes from './routes/workCenters.js';
import jobRoutes from './routes/jobs.js';
import documentRoutes from './routes/documents.js';
import posRoutes from './routes/pos.js';
import aiRoutes from './routes/ai.js';
import inventoryV1Routes from './routes/inventoryV1.js';
import bomV1Routes from './routes/bomV1.js';
import optimizationV1Routes from './routes/optimizationV1.js';
import analyticsV1Routes from './routes/analyticsV1.js';
import shippingV1Routes from './routes/shippingV1.js';
import eventsV1Routes from './routes/eventsV1.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import orderHubRoutes from './routes/orderHubRoutes.js';
import aiOrderHubRoutes from './routes/aiOrderHubRoutes.js';
import ingestRoutes from './routes/ingestRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';
import stopWorkRoutes from './routes/stopWork.js';
import { initOrderHubData } from './routes/initOrderHubData.js';
import { seedSupabaseData } from './seeds/supabaseSeed.js';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/heats', heatRoutes);
app.use('/api/coils', coilRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/work-centers', workCenterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/v1/inventory', inventoryV1Routes);
app.use('/api/v1/bom', bomV1Routes);
app.use('/api/v1/ai/work-order-optimize', optimizationV1Routes);
app.use('/api/v1/analytics', analyticsV1Routes);
app.use('/api/v1/shipping', shippingV1Routes);
app.use('/api/v1/shipments', shippingV1Routes);
app.use('/api/v1/events', eventsV1Routes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/work-centers', workCenterRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/operations', operationsRoutes);

// OrderHub - Unified Order Pipeline
app.use('/api/v1', orderHubRoutes);        // /api/v1/contacts, /api/v1/rfq, /api/v1/quotes, /api/v1/orders
app.use('/api/v1/ai', aiOrderHubRoutes);   // /api/v1/ai/parse-email-rfq, /api/v1/ai/quote-assistant
app.use('/api/v1/ingest', ingestRoutes);   // /api/v1/ingest/email-rfq

// Pipeline Orchestrator - Complete Order-to-Invoice Workflow
app.use('/api/v1/pipeline', pipelineRoutes);  // /api/v1/pipeline (create, advance, auto-advance, simulate)

// Safety Module - Stop-Work Authority System
app.use('/api/safety/stop-work', stopWorkRoutes);  // /api/safety/stop-work (initiate, clear, validate)

// Initialize OrderHub seed data (in-memory store)
console.log('🌱 Initializing in-memory OrderHub data...');
initOrderHubData();
console.log('✅ In-memory data initialized');

// Seed Supabase database (async)
seedSupabaseData()
  .then(() => console.log('✅ Supabase seed complete'))
  .catch(err => console.error('❌ Supabase seed error:', err));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 SteelWise API running on port ${PORT}`);
  console.log(`📡 Server object created:`, !!server);
  console.log(`🔌 Server listening:`, server.listening);
});

console.log('🔧 After app.listen() call...');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - keep server running
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('✅ All listeners attached, entering event loop...');
