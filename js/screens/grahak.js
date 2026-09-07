import * as db from '../db.js';
import { balance } from '../ledger.js';
import { rupees } from '../fmt.js';
import { shareBackup } from '../backup.js';

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
    <label for="new-name">नया ग्राहक — नाम</label>
    <input id="new-name" type="text">
    <label for="new-phone">मोबाइल नंबर</label>
    <input id="new-phone" type="tel" inputmode="numeric">
    <button id="add-cust" class="btn">ग्राहक जोड़ें</button>
    <p id="cust-status"></p>
    <h3>सभी ग्राहक</h3>
    ${customers.length === 0 ? '<p>अभी कोई ग्राहक नहीं है।</p>' :
      customers.map((c, i) => `
        <div class="row">
          <span>${c.name}<br><small>${c.phone || ''}</small></span>
          <strong>${rupees(balances[i])}</strong>
        </div>`).join('')}
    <button id="backup" class="btn">बैकअप फ़ाइल भेजें</button>
  `;

  panel.querySelector('#add-cust').addEventListener('click', async () => {
    const name = panel.querySelector('#new-name').value.trim();
    const phone = panel.querySelector('#new-phone').value.trim();
    const status = panel.querySelector('#cust-status');
    if (!name) { status.textContent = 'ग्राहक का नाम भरें।'; return; }
    await db.put('customers', { name, phone });
    await initGrahak();
  });

  panel.querySelector('#backup').addEventListener('click', shareBackup);
}
