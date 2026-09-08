import * as db from './db.js';
import { APP_VERSION } from './config.js';
import { validateBackup } from './backup-validate.js';

const STORES = ['rates', 'bills', 'customers', 'payments', 'items', 'pledges', 'pledgePayments'];

export async function exportAll() {
  const [rates, bills, customers, payments, items, pledges, pledgePayments] =
    await Promise.all(STORES.map((s) => db.all(s)));
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    rates, bills, customers, payments, items, pledges, pledgePayments
  };
}

export async function shareBackup() {
  const data = await exportAll();
  const json = JSON.stringify(data, null, 2);
  const name = `sarafa-backup-${data.exportedAt.slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'सर्राफ बैकअप' });
      return;
    } catch (err) {
      // He tapped cancel, or the OS refused the sheet. Neither is a failure —
      // fall through to a plain download rather than alarming him.
      if (err && err.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// Replaces the entire ledger with the backup's contents. Validated first so a
// bad file cannot leave the ledger half-restored.
export async function restoreFrom(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: 'यह फ़ाइल पढ़ी नहीं जा सकी।' };
  }
  const check = validateBackup(parsed);
  if (!check.ok) return check;

  for (const s of STORES) await db.clear(s);
  for (const s of STORES) {
    for (const row of parsed[s] || []) await db.put(s, row);
  }
  return { ok: true, counts: check.counts };
}
