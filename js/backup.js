import * as db from './db.js';
import { APP_VERSION } from './config.js';

export async function exportAll() {
  const [rates, bills, customers, payments] = await Promise.all([
    db.all('rates'), db.all('bills'), db.all('customers'), db.all('payments')
  ]);
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    rates, bills, customers, payments
  };
}

export async function shareBackup() {
  const data = await exportAll();
  const json = JSON.stringify(data, null, 2);
  const name = `sarafa-backup-${data.exportedAt.slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'सर्राफ बैकअप' });
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
