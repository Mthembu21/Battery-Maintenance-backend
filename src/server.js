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
  throw new Error('Missing MONGODB_URI');
}
if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET');
}
if (!publicBaseUrl) {
  throw new Error('Missing PUBLIC_BASE_URL');
}

await connectDb();

const app = createApp();

cron.schedule('0 6 * * 1', async () => {
  await runMissedServiceDetection();
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
