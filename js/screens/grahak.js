import * as db from '../db.js';
import { balance } from '../ledger.js';
import { rupees } from '../fmt.js';
import { shareBackup, restoreFrom } from '../backup.js';
import { transliterate } from '../hindi.js';
import { VILLAGES, filterCustomers, villagesInUse, villageOf,
         displayName } from '../villages.js';
import { demoCustomers, demoBills, demoPayments, demoPledges,
         demoPledgePayments } from '../demo.js';
import { currentRates } from './bhav.js';

export async function customerBalance(customerId) {
  const [bills, payments] = await Promise.all([
    db.byIndex('bills', 'byCustomer', customerId),
    db.byIndex('payments', 'byCustomer', customerId)
  ]);
  return balance({ bills, payments });
}

// Filters live outside the render so re-rendering keeps the current view.
const filters = { village: '', query: '' };

export async function initGrahak() {
  const panel = document.getElementById('panel-grahak');
  const customers = await db.all('customers');
  const balances = await Promise.all(customers.map((c) => customerBalance(c.id)));
  const balanceById = new Map(customers.map((c, i) => [c.id, balances[i]]));
  const shown = filterCustomers(customers, filters);
  const shownDue = shown.reduce((s, c) => s + (balanceById.get(c.id) || 0), 0);

  panel.innerHTML = `
    <h3>नया ग्राहक</h3>
    <label for="new-name">नाम — हिंदी या अंग्रेज़ी में लिखें</label>
    <input id="new-name" type="text" list="name-suggest" autocomplete="off"
           placeholder="जैसे: ramu या रामू">
    <datalist id="name-suggest">
      ${customers.map((c) => `<option value="${c.name}"></option>`).join('')}
    </datalist>
    <p id="name-preview" class="preview"></p>
    <label for="new-village">गाँव / क़स्बा</label>
    <input id="new-village" type="text" list="village-list" autocomplete="off"
           placeholder="जैसे: अवागढ़">
    <datalist id="village-list">
      ${[...new Set([...villagesInUse(customers), ...VILLAGES])]
        .map((v) => `<option value="${v}"></option>`).join('')}
    </datalist>
    <label for="new-phone">मोबाइल नंबर</label>
    <input id="new-phone" type="tel" inputmode="numeric" autocomplete="off">
    <button id="add-cust" class="btn">ग्राहक जोड़ें</button>
    <p id="cust-status" class="warn"></p>

    <h3>सभी ग्राहक</h3>
    <label for="filter-village">गाँव से छाँटें</label>
    <select id="filter-village">
      <option value="">— सभी गाँव —</option>
      ${villagesInUse(customers).map((v) =>
        `<option value="${v}" ${v === filters.village ? 'selected' : ''}>${v}</option>`).join('')}
    </select>
    <label for="filter-query">नाम या नंबर खोजें</label>
    <input id="filter-query" type="search" autocomplete="off" value="${filters.query}"
           placeholder="जैसे: रामू या 9876">
    <p class="muted small">${shown.length} / ${customers.length} ग्राहक ·
       बकाया ${rupees(shownDue)}</p>
    ${shown.length === 0 ? '<p class="muted">कोई ग्राहक नहीं मिला।</p>' :
      shown.map((c) => `
        <div class="row">
          <span>${displayName(c)}<br><small>${c.phone || ''}</small></span>
          <strong>${rupees(balanceById.get(c.id) || 0)}</strong>
        </div>`).join('')}

    <h3>बैकअप</h3>
    <p class="muted">फ़ोन खो जाए तो खाता न खोए — हफ़्ते में एक बार बैकअप भेजें।</p>
    <button id="backup" class="btn ghost">बैकअप फ़ाइल भेजें</button>
    <label for="restore" class="btn ghost restore-label">बैकअप से वापस लाएं</label>
    <input id="restore" type="file" accept="application/json,.json" hidden>
    <p id="restore-status" class="warn"></p>

    <h3>डेमो डेटा</h3>
    <p class="muted small">ऐप को आज़माने के लिए नकली डेटा — अवागढ़ और
       आस-पास के गाँवों के नाम से। असली हिसाब शुरू करने से पहले इसे हटा दें।
       हटाने पर सिर्फ़ डेमो मिटेगा, आपका असली हिसाब सुरक्षित रहेगा।</p>
    <button id="demo-load" class="btn ghost">डेमो डेटा भरें</button>
    <button id="demo-clear" class="btn ghost">डेमो डेटा हटाएं</button>
    <p id="demo-status" class="warn"></p>
  `;

  const nameInput = panel.querySelector('#new-name');
  const preview = panel.querySelector('#name-preview');
  const status = panel.querySelector('#cust-status');

  // Live Devanagari preview. Typing "ramu" shows रमु; typing Hindi directly
  // shows nothing extra, because there is nothing to convert.
  const updatePreview = () => {
    const raw = nameInput.value.trim();
    const hi = transliterate(raw);
    preview.textContent = (raw && hi !== raw) ? `हिंदी में: ${hi}` : '';
  };
  nameInput.addEventListener('input', updatePreview);

  panel.querySelector('#add-cust').addEventListener('click', async () => {
    const raw = nameInput.value.trim();
    const name = transliterate(raw);
    const phone = panel.querySelector('#new-phone').value.trim();
    if (!name) { status.textContent = 'ग्राहक का नाम भरें।'; return; }
    if (customers.some((c) => c.name === name)) {
      status.textContent = 'यह ग्राहक पहले से मौजूद है।';
      return;
    }
    await db.put('customers', {
      name, phone,
      village: panel.querySelector('#new-village').value.trim()
    });
    await initGrahak();
  });

  const fv = panel.querySelector('#filter-village');
  const fq = panel.querySelector('#filter-query');
  fv.addEventListener('change', () => { filters.village = fv.value; initGrahak(); });
  fq.addEventListener('input', () => {
    filters.query = fq.value;
    initGrahak().then(() => {
      // Keep the cursor in the search box while typing.
      const box = document.getElementById('filter-query');
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    });
  });

  panel.querySelector('#backup').addEventListener('click', shareBackup);

  const demoStatus = panel.querySelector('#demo-status');

  panel.querySelector('#demo-load').addEventListener('click', async () => {
    demoStatus.textContent = 'डेमो डेटा भरा जा रहा है…';
    const rates = await currentRates();
    const sona = rates ? rates.sonaPerGram : 725000;
    const chandi = rates ? rates.chandiPerGram : 9200;

    const custIds = [];
    for (const c of demoCustomers()) custIds.push(await db.put('customers', c));
    for (const b of demoBills(custIds, sona, chandi)) await db.put('bills', b);
    for (const p of demoPayments(custIds)) await db.put('payments', p);

    const pledgeIds = [];
    for (const p of demoPledges()) pledgeIds.push(await db.put('pledges', p));
    for (const p of demoPledgePayments(pledgeIds)) await db.put('pledgePayments', p);

    await initGrahak();
    const s2 = document.getElementById('demo-status');
    if (s2) s2.textContent = 'डेमो डेटा भर गया। हर टैब देखें।';
  });

  // Deletes ONLY records tagged demo:true. A real bill entered by hand has no
  // such tag and is never touched.
  panel.querySelector('#demo-clear').addEventListener('click', async () => {
    demoStatus.textContent = 'डेमो हटाया जा रहा है…';
    let removed = 0;
    for (const store of ['bills', 'payments', 'customers',
                         'pledgePayments', 'pledges', 'items']) {
      for (const row of await db.all(store)) {
        if (row.demo === true) { await db.del(store, row.id); removed += 1; }
      }
    }
    await initGrahak();
    const s2 = document.getElementById('demo-status');
    if (s2) s2.textContent = `${removed} डेमो रिकॉर्ड हटाए गए। असली हिसाब सुरक्षित है।`;
  });

  const restoreInput = panel.querySelector('#restore');
  const restoreStatus = panel.querySelector('#restore-status');
  restoreInput.addEventListener('change', async () => {
    const file = restoreInput.files[0];
    if (!file) return;
    restoreStatus.textContent = 'वापस लाया जा रहा है…';
    const r = await restoreFrom(file);
    if (!r.ok) { restoreStatus.textContent = r.error; return; }
    restoreStatus.textContent =
      `वापस आ गया — ${r.counts.customers} ग्राहक, ${r.counts.bills} बिल।`;
    await initGrahak();
  });
}
