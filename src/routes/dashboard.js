import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Battery } from '../models/Battery.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { getWeekKey } from '../utils/week.js';
import { calculateYtdComplianceForBattery, calculateMonthlyComplianceForBattery } from '../utils/compliance.js';

const router = Router();

router.get('/overview', requireAuth, async (req, res) => {
  const totalBatteries = await Battery.countDocuments({});

  const weekKey = getWeekKey(new Date());
  const servicedThisWeek = await MaintenanceRecord.distinct('batteryId', { weekKey });

  const missedServices = await Battery.countDocuments({ status: 'Missed Service' });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const batteries = await Battery.find({}).select({ batteryId: 1, _id: 0 });
  let monthlySum = 0;
  let ytdSum = 0;

  for (const b of batteries) {
    const m = await calculateMonthlyComplianceForBattery(b.batteryId, monthStart, monthEnd);
    const y = await calculateYtdComplianceForBattery(b.batteryId, now.getUTCFullYear());
    monthlySum += m.compliancePct;
    ytdSum += y.compliancePct;
  }

  const monthlyCompliancePct = batteries.length ? Math.round(monthlySum / batteries.length) : 0;
  const ytdCompliancePct = batteries.length ? Math.round(ytdSum / batteries.length) : 0;

  return res.json({
    totalBatteries,
    batteriesServicedThisWeek: servicedThisWeek.length,
    missedServices,
    monthlyCompliancePct,
    ytdCompliancePct
  });
});

export default router;
