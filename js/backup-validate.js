const STORES = ['rates', 'bills', 'customers', 'payments'];

// Restoring overwrites the whole ledger, so a malformed file must be caught
// here rather than half-applied.
export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'यह बैकअप फ़ाइल सही नहीं है।' };
  }
  for (const s of STORES) {
    if (!Array.isArray(data[s])) {
      return { ok: false, error: `बैकअप में "${s}" नहीं मिला या वह सही नहीं है।` };
    }
  }
  const counts = {};
  for (const s of STORES) counts[s] = data[s].length;
  return { ok: true, counts };
}
