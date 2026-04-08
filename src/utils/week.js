export function getWeekKey(dateInput) {
  const d = new Date(dateInput);
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  const year = date.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

export function getYearWeekKeysToDate(year = new Date().getFullYear(), upToDate = new Date()) {
  const keys = [];
  const d = new Date(upToDate);
  const currentKey = getWeekKey(d);
  const match = currentKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return keys;
  const currentWeek = Number(match[2]);
  for (let w = 1; w <= currentWeek; w += 1) {
    keys.push(`${year}-W${String(w).padStart(2, '0')}`);
  }
  return keys;
}
