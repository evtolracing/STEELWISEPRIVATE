import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth.js';
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 SteelWise API running on port ${PORT}`);
});
