import { Battery } from '../models/Battery.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { getWeekKey } from '../utils/week.js';

export async function runMissedServiceDetection() {
  const weekKey = getWeekKey(new Date());
  const batteries = await Battery.find({}).select({ _id: 1, assetId: 1 });

  for (const b of batteries) {
    const hasRecord = await MaintenanceRecord.exists({ assetId: b.assetId, weekKey, pdf: { $exists: true } });
    if (!hasRecord) {
      await Battery.updateOne({ _id: b._id }, { $set: { status: 'Missed Service' } });
    }
  }
}
