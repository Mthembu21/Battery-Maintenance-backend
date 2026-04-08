import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Battery } from '../models/Battery.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { monthExpectedServices } from '../utils/compliance.js';

const router = Router();

router.get('/monthly-compliance', requireAuth, async (req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const totalBatteries = await Battery.countDocuments({});
  const expectedServices = totalBatteries * monthExpectedServices();
  const completedServices = await MaintenanceRecord.countDocuments({
    maintenanceDate: { $gte: monthStart, $lte: monthEnd }
  });
  const completedCapped = Math.min(completedServices, expectedServices);
  const missedServices = Math.max(expectedServices - completedCapped, 0);
  const compliancePct = expectedServices === 0 ? 0 : Math.round((completedCapped / expectedServices) * 100);

  return res.json({
    totalBatteries,
    expectedServices,
    completedServices: completedCapped,
    missedServices,
    compliancePct
  });
});

router.get('/ytd-compliance', requireAuth, async (req, res) => {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const totalWeeksElapsed = Math.ceil((now - yearStart) / (7 * 86400000));

  const batteries = await Battery.find({}).select({ batteryId: 1, _id: 0 });
  const rows = [];

  for (const b of batteries) {
    const expected = totalWeeksElapsed;
    const completed = await MaintenanceRecord.countDocuments({
      batteryId: b.batteryId,
      maintenanceDate: { $gte: yearStart, $lte: now }
    });
    const completedCapped = Math.min(completed, expected);
    const missed = Math.max(expected - completedCapped, 0);
    const compliancePct = expected === 0 ? 0 : Math.round((completedCapped / expected) * 100);
    rows.push({ batteryId: b.batteryId, expectedServices: expected, completedServices: completedCapped, missedServices: missed, ytdCompliancePct: compliancePct });
  }

  return res.json(rows);
});

router.get('/technician-activity', requireAuth, async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: { technicianName: '$technicianName' },
        maintenanceRecordsSubmitted: { $sum: 1 },
        pdfsUploaded: { $sum: 1 },
        batteriesServicedSet: { $addToSet: '$batteryId' }
      }
    },
    {
      $project: {
        _id: 0,
        technicianName: '$_id.technicianName',
        maintenanceRecordsSubmitted: 1,
        pdfsUploaded: 1,
        batteriesServiced: { $size: '$batteriesServicedSet' }
      }
    },
    { $sort: { maintenanceRecordsSubmitted: -1 } }
  ];

  const rows = await MaintenanceRecord.aggregate(pipeline);
  return res.json(rows);
});

export default router;
