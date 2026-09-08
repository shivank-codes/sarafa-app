export function daySummary(bills, date) {
  const today = bills.filter((b) => b.date === date);
  const sum = (s) => today
    .filter((b) => b.settlement === s)
    .reduce((t, b) => t + b.totalPaise, 0);
  const nakadPaise = sum('nakad');
  const udhaarPaise = sum('udhaar');
  return {
    count: today.length,
    nakadPaise,
    udhaarPaise,
    totalPaise: nakadPaise + udhaarPaise
  };
}

export function rateChange(todayPaise, previousPaise) {
  if (previousPaise == null) return null;
  const diff = todayPaise - previousPaise;
  return {
    deltaPaise: Math.abs(diff),
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
  };
}
