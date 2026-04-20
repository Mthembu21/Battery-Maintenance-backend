import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

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
console.log("Auth routes mounted at /api/auth");

// DASHBOARD ROUTES
app.use('/api/dashboard', dashboardRoutes);
console.log("Dashboard routes mounted at /api/dashboard");

app.get('/api/test', (req, res) => {
  res.json({ ok: true });
});

export default app;
