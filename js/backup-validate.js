const REQUIRED = ['rates', 'bills', 'customers', 'payments'];
// Added after the first release. A backup taken before the catalog existed
// must still restore, so this store is optional and defaults to empty.
const OPTIONAL = ['items'];

export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'यह बैकअप फ़ाइल सही नहीं है।' };
  }
  for (const s of REQUIRED) {
    if (!Array.isArray(data[s])) {
      return { ok: false, error: `बैकअप में "${s}" नहीं मिला या वह सही नहीं है।` };
    }
  }
  for (const s of OPTIONAL) {
    if (data[s] !== undefined && !Array.isArray(data[s])) {
      return { ok: false, error: `बैकअप में "${s}" सही नहीं है।` };
    }
  }
  const counts = {};
  for (const s of REQUIRED) counts[s] = data[s].length;
  for (const s of OPTIONAL) counts[s] = (data[s] || []).length;
  return { ok: true, counts };
}
