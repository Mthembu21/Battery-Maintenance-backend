import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();

// CORS MUST be declared BEFORE routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://battery-maintenance.onrender.com'
  ],
  credentials: true
}));

// Enable OPTIONS pre-flight
app.options('*', cors());

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
