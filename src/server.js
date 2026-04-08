import 'dotenv/config';
import cron from 'node-cron';
import { createApp } from './app.js';
import connectDb from './config/db.js';
import { runMissedServiceDetection } from './jobs/missedServiceJob.js';

const port = Number(process.env.PORT ?? 4000);

const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const publicBaseUrl = process.env.PUBLIC_BASE_URL;

if (!mongoUri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}
if (!jwtSecret) {
  console.error('Missing JWT_SECRET environment variable');
  process.exit(1);
}
if (!publicBaseUrl) {
  console.error('Missing PUBLIC_BASE_URL environment variable');
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

try {
  await connectDb();
  console.log('✅ Database connected successfully');
} catch (error) {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
}

const app = createApp();

// Schedule cron job with error handling
cron.schedule('0 6 * * 1', async () => {
  try {
    console.log('Running missed service detection job...');
    await runMissedServiceDetection();
    console.log('Missed service detection job completed');
  } catch (error) {
    console.error('Error in missed service detection job:', error);
  }
});

const server = app.listen(port, () => {
  console.log(`🚀 API listening on http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
