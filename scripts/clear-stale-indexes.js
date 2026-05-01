import mongoose from 'mongoose';
import { Battery } from '../src/models/Battery.js';
import dotenv from 'dotenv/config';

async function clearStaleIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all indexes on the batteries collection
    const db = mongoose.connection.db;
    const collection = db.collection('batteries');
    const indexes = await collection.indexes();
    
    console.log('Current indexes:', indexes);
    
    // Drop any indexes that reference 'batteryId' or 'batteryCategory' fields
    for (const index of indexes) {
      if (index.key && (index.key.batteryId !== undefined || index.key.batteryCategory !== undefined)) {
        console.log(`Dropping stale index: ${index.name}`);
        await collection.dropIndex(index.name);
      }
    }
    
    console.log('Stale indexes cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing indexes:', error);
    process.exit(1);
  }
}

clearStaleIndexes();
