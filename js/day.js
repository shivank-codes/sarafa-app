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
