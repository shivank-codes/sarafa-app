import * as db from '../db.js';
import { lineTotal } from '../calc.js';
import { rupees } from '../fmt.js';
import { currentRates, todayISO } from './bhav.js';

export async function initBill() {
  const panel = document.getElementById('panel-bill');
  const rates = await currentRates();

  if (!rates) {
    panel.innerHTML = '<p>पहले आज का भाव भरें। नीचे "भाव" पर जाएँ।</p>';
    return;
  }

  const customers = await db.all('customers');

  panel.innerHTML = `
    <label for="metal">धातु</label>
    <select id="metal">
      <option value="sona">सोना</option>
      <option value="chandi">चांदी</option>
    </select>
    <label for="weight">वज़न (ग्राम)</label>
    <input id="weight" type="number" inputmode="decimal" min="0" step="0.001">
    <label for="making">मजदूरी (₹)</label>
    <input id="making" type="number" inputmode="decimal" min="0" step="1" value="0">
    <p>कुल: <span id="bill-total" class="total">₹0</span></p>
    <button id="save-nakad" class="btn">नकद</button>
    <label for="cust">उधार — ग्राहक</label>
    <select id="cust">
      <option value="">— ग्राहक चुनें —</option>
      ${customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
    </select>
    <button id="save-udhaar" class="btn">उधार लिखें</button>
    <p id="bill-status"></p>
  `;

  const metal = panel.querySelector('#metal');
  const weight = panel.querySelector('#weight');
  const making = panel.querySelector('#making');
  const totalEl = panel.querySelector('#bill-total');
  const status = panel.querySelector('#bill-status');

  const rateNow = () =>
    metal.value === 'sona' ? rates.sonaPerGram : rates.chandiPerGram;

  const currentTotal = () => lineTotal({
    weight: Number(weight.value) || 0,
    ratePerGram: rateNow(),
    makingPaise: Math.round((Number(making.value) || 0) * 100)
  });

  const refresh = () => { totalEl.textContent = rupees(currentTotal()); };
  metal.addEventListener('change', refresh);
  weight.addEventListener('input', refresh);
  making.addEventListener('input', refresh);

  async function save(settlement, customerId) {
    const w = Number(weight.value);
    if (!(w > 0)) { status.textContent = 'वज़न भरें।'; return; }
    if (settlement === 'udhaar' && !customerId) {
      status.textContent = 'उधार के लिए ग्राहक चुनें।';
      return;
    }
    const total = currentTotal();
    await db.put('bills', {
      date: todayISO(),
      metal: metal.value,
      weight: w,
      ratePerGram: rateNow(),
      makingPaise: Math.round((Number(making.value) || 0) * 100),
      totalPaise: total,
      settlement,
      customerId: customerId || null
    });
    status.textContent = `बिल सुरक्षित — ${rupees(total)}`;
    weight.value = '';
    making.value = '0';
    refresh();
  }

  panel.querySelector('#save-nakad')
    .addEventListener('click', () => save('nakad', null));
  panel.querySelector('#save-udhaar')
    .addEventListener('click', () =>
      save('udhaar', Number(panel.querySelector('#cust').value) || null));
}
