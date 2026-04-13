import express from 'express';
import authRoutes from './routes/auth.js';

const app = express();

app.use(express.json());

// HEALTH CHECK (Render uses this to verify server)
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// AUTH ROUTES (THIS IS CRITICAL)
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
  res.json({ ok: true });
});

export default app;
