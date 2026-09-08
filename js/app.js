import { SHOP_NAME } from './config.js';
import { requestPersistence, open as openDb } from './db.js';
import { initBhav } from './screens/bhav.js';
import { initBill } from './screens/bill.js';
import { initUdhaar } from './screens/udhaar.js';
import { initGrahak } from './screens/grahak.js';
import { initDesign } from './screens/design.js';
import { initGirvi } from './screens/girvi.js';

const TABS = ['bhav', 'bill', 'udhaar', 'grahak', 'design', 'girvi'];

export function showTab(name) {
  for (const t of TABS) {
    document.getElementById('panel-' + t).hidden = (t !== name);
    document.querySelector(`#tabs button[data-tab="${t}"]`)
      .classList.toggle('active', t === name);
  }
  if (name === 'bhav') initBhav();
  if (name === 'bill') initBill();
  if (name === 'udhaar') initUdhaar();
  if (name === 'grahak') initGrahak();
  if (name === 'design') initDesign();
  if (name === 'girvi') initGirvi();
}

document.getElementById('shop-name').textContent = SHOP_NAME;
document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) showTab(btn.dataset.tab);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// A shop ledger must not be silently evicted by the browser under storage
// pressure. iOS grants this once the app is on the home screen.
requestPersistence().catch(() => {});

// If storage is genuinely unavailable (private browsing, blocked site data)
// the app would fail silently mid-sale, so say so in Hindi. This checks
// storage directly rather than reacting to any stray rejection — a cancelled
// share sheet must never raise a data-loss warning.
openDb().catch(() => {
  const banner = document.getElementById('storage-warning');
  if (!banner) return;
  banner.hidden = false;
  banner.textContent =
    'चेतावनी: फ़ोन में डेटा सुरक्षित नहीं हो पा रहा। ' +
    'ऐप को होम स्क्रीन पर जोड़ें और प्राइवेट विंडो बंद करें।';
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('sarafa:', e.reason);
});

initBhav();
