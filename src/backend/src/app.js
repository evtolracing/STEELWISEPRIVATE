/**
 * Express App - Separated from server startup for Vercel serverless compatibility
 * This file creates and configures the Express app WITHOUT calling app.listen()
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
import intakeOrderRoutes from './routes/intakeOrders.js';
import salesRoutes from './routes/salesRoutes.js';
import executiveRoutes from './routes/executive.js';
import dropTagRoutes from './routes/dropTagRoutes.js';
import staffRoutes from './routes/staff.js';
import qcRoutes from './routes/qcRoutes.js';
import materialTrackingRoutes from './routes/materialTrackingRoutes.js';
import partnerAuthRoutes from './routes/partner/partnerAuthRoutes.js';
import partnerCustomerRoutes from './routes/partner/customerRoutes.js';
import partnerSupplierRoutes from './routes/partner/supplierRoutes.js';
import partnerCarrierRoutes from './routes/partner/carrierRoutes.js';
import partnerWebhookRoutes from './routes/partner/webhookRoutes.js';
import partnerAdminRoutes from './routes/partner/adminRoutes.js';
import maintenanceOrderRoutes from './routes/maintenanceOrders.js';
import assetRoutes from './routes/assets.js';
import specRoutes from './routes/specInheritance.js';
import ttsRoutes from './routes/tts.js';
import aiAssistantRoutes from './routes/aiAssistant.js';
import opsCockpitRoutes from './routes/opsCockpit.js';
import printQueueRoutes from './routes/printQueue.js';
import { initOrderHubData } from './routes/initOrderHubData.js';
import prisma from './lib/db.js';

dotenv.config();

const app = express();
export { prisma };

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically (skip on Vercel's read-only filesystem)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  const fs = await import('fs');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }
} catch (e) {
  // Vercel: uploads directory doesn't exist, skip static serving
}

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
app.use('/api/orders/intake', intakeOrderRoutes);
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
app.use('/api/ai/tts', ttsRoutes);
app.use('/api/ai/assistant', aiAssistantRoutes);
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
app.use('/api/v1', orderHubRoutes);
app.use('/api/v1/ai', aiOrderHubRoutes);
app.use('/api/v1/ingest', ingestRoutes);

// Pipeline Orchestrator
app.use('/api/v1/pipeline', pipelineRoutes);

// Safety Module
app.use('/api/safety/stop-work', stopWorkRoutes);

// Sales & Pricing Intelligence
app.use('/api/sales', salesRoutes);

// Executive Ops Cockpit
app.use('/api/executive', executiveRoutes);

// Drop Tag Engine
app.use('/api/drop-tags', dropTagRoutes);

// Staff & Operator Management
app.use('/api/staff', staffRoutes);

// QC Inspection
app.use('/api/qc', qcRoutes);

// Material Tracking
app.use('/api/material-tracking', materialTrackingRoutes);

// Maintenance Work Orders
app.use('/api/maintenance-orders', maintenanceOrderRoutes);

// Asset Registry
app.use('/api/assets', assetRoutes);

// Spec Inheritance
app.use('/api/specs', specRoutes);

// Ops Cockpit
app.use('/api/ops-cockpit', opsCockpitRoutes);

// Print Queue
app.use('/api/print-queue', printQueueRoutes);

// Partner API
app.use('/api/v1/partner/auth', partnerAuthRoutes);
app.use('/api/v1/partner/customer', partnerCustomerRoutes);
app.use('/api/v1/partner/supplier', partnerSupplierRoutes);
app.use('/api/v1/partner/carrier', partnerCarrierRoutes);
app.use('/api/v1/partner/webhooks', partnerWebhookRoutes);
app.use('/api/v1/admin/partners', partnerAdminRoutes);

// Initialize OrderHub seed data (in-memory store)
initOrderHubData();

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
