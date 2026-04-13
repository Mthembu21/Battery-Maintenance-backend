import 'dotenv/config';
import cron from 'node-cron';
import { createApp } from './src/app.js';
import connectDb from './config/db.js';
import { runMissedServiceDetection } from './jobs/missedServiceJob.js';

const port = process.env.PORT || 4000;

// connect DB
await connectDb();
console.log('✅ Database connected');

const app = createApp();

// cron job
cron.schedule('0 6 * * 1', async () => {
  try {
    console.log('Running missed service detection job...');
    await runMissedServiceDetection();
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});