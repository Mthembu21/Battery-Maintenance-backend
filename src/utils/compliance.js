import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { getYearWeekKeysToDate } from './week.js';

export function monthExpectedServices() {
  return 4;
}

export async function calculateMonthlyComplianceForBattery(batteryId, monthStart, monthEnd) {
  const records = await MaintenanceRecord.countDocuments({
    batteryId,
    maintenanceDate: { $gte: monthStart, $lte: monthEnd }
  });
  const expected = monthExpectedServices();
  const completed = Math.min(records, expected);
  const missed = Math.max(expected - completed, 0);
  const compliancePct = expected === 0 ? 0 : Math.round((completed / expected) * 100);
  return { expected, completed, missed, compliancePct };
}

export async function calculateYtdComplianceForBattery(batteryId, year = new Date().getFullYear()) {
  const weeks = getYearWeekKeysToDate(year);
  const expected = weeks.length;
  const completed = await MaintenanceRecord.countDocuments({ batteryId, weekKey: { $in: weeks } });
  const missed = Math.max(expected - completed, 0);
  const compliancePct = expected === 0 ? 0 : Math.round((completed / expected) * 100);
  return { expected, completed, missed, compliancePct };
}
