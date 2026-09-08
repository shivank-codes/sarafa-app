import * as db from '../db.js';
import { balance } from '../ledger.js';
import { rupees } from '../fmt.js';
import { shareBackup } from '../backup.js';
import { transliterate } from '../hindi.js';

export async function customerBalance(customerId) {
  const [bills, payments] = await Promise.all([
    db.byIndex('bills', 'byCustomer', customerId),
    db.byIndex('payments', 'byCustomer', customerId)
  ]);
  return balance({ bills, payments });
}

export async function initGrahak() {
  const panel = document.getElementById('panel-grahak');
  const customers = await db.all('customers');
  const balances = await Promise.all(customers.map((c) => customerBalance(c.id)));

  panel.innerHTML = `
    <h3>नया ग्राहक</h3>
    <label for="new-name">नाम — हिंदी या अंग्रेज़ी में लिखें</label>
    <input id="new-name" type="text" list="name-suggest" autocomplete="off"
           placeholder="जैसे: ramu या रामू">
    <datalist id="name-suggest">
      ${customers.map((c) => `<option value="${c.name}"></option>`).join('')}
    </datalist>
    <p id="name-preview" class="preview"></p>
    <label for="new-phone">मोबाइल नंबर</label>
    <input id="new-phone" type="tel" inputmode="numeric" autocomplete="off">
    <button id="add-cust" class="btn">ग्राहक जोड़ें</button>
    <p id="cust-status" class="warn"></p>

    <h3>सभी ग्राहक</h3>
    ${customers.length === 0 ? '<p class="muted">अभी कोई ग्राहक नहीं है।</p>' :
      customers.map((c, i) => `
        <div class="row">
          <span>${c.name}<br><small>${c.phone || ''}</small></span>
          <strong>${rupees(balances[i])}</strong>
        </div>`).join('')}

    <button id="backup" class="btn ghost">बैकअप फ़ाइल भेजें</button>
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
    await db.put('customers', { name, phone });
    await initGrahak();
  });

  panel.querySelector('#backup').addEventListener('click', shareBackup);
}
