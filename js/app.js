import { SHOP_NAME } from './config.js';
import { initBhav } from './screens/bhav.js';
import { initBill } from './screens/bill.js';
import { initUdhaar } from './screens/udhaar.js';
import { initGrahak } from './screens/grahak.js';

const TABS = ['bhav', 'bill', 'udhaar', 'grahak'];

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
}

document.getElementById('shop-name').textContent = SHOP_NAME;
document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) showTab(btn.dataset.tab);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

initBhav();
