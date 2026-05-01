import 'dotenv/config';
import app from './src/app.js';
import connectDb from './src/config/db.js';

const port = process.env.PORT || 4000;

await connectDb();

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});