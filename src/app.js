import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

import authRoutes from './routes/auth.js';
import batteryRoutes from './routes/batteries.js';
import maintenanceRoutes from './routes/maintenance.js';
import filesRoutes from './routes/files.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';

export function createApp() {
  const app = express();

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  app.use(morgan('dev'));
  app.use(express.json({ limit: '2mb' }));

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? '*',
      credentials: true
    })
  );

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/api/test', (req, res) => {
    console.log('=== TEST ROUTE HIT ===');
    res.json({ 
      ok: true, 
      message: 'Backend is deployed and routes are working',
      timestamp: new Date().toISOString()
    });
  });

  console.log('=== MOUNTING AUTH ROUTES ===');
  app.use('/api/auth', authRoutes);
  console.log('=== AUTH ROUTES MOUNTED ===');
  
  app.use('/api/batteries', batteryRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/files', filesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use((err, req, res, next) => {
    if (err?.message === 'Only PDF allowed') return res.status(400).json({ message: err.message });
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'PDF too large (max 15MB)' });
    return res.status(500).json({ message: 'Server error' });
  });

  return app;
}
