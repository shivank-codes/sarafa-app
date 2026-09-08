import * as db from '../db.js';
import { outstanding } from '../ledger.js';
import { rupees } from '../fmt.js';
import { SHOP_NAME } from '../config.js';

export function reminderLink(customer, balancePaise) {
  const digits = String(customer.phone || '').replace(/\D/g, '');
  const number = digits.length === 10 ? '91' + digits : digits;
  const msg =
    `नमस्ते ${customer.name} जी, ${SHOP_NAME} की ओर से याद दिलाना है — ` +
    `आपका बकाया ${rupees(balancePaise)} है। धन्यवाद।`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

export async function initUdhaar() {
  const panel = document.getElementById('panel-udhaar');
  const customers = await db.all('customers');

  const billsBy = {};
  const paymentsBy = {};
  await Promise.all(customers.map(async (c) => {
    billsBy[c.id] = await db.byIndex('bills', 'byCustomer', c.id);
    paymentsBy[c.id] = await db.byIndex('payments', 'byCustomer', c.id);
  }));

  const rows = outstanding(customers, billsBy, paymentsBy);
  const totalDue = rows.reduce((s, r) => s + r.balancePaise, 0);

  panel.innerHTML = `
    <p>कुल बकाया: <span class="total">${rupees(totalDue)}</span></p>
    ${rows.length === 0 ? '<p>किसी का उधार बाकी नहीं है।</p>' :
      rows.map((r) => `
        <div class="card">
          <div class="row">
            <span>${r.customer.name}</span>
            <strong>${rupees(r.balancePaise)}</strong>
          </div>
          <input class="pay-amt" type="number" inputmode="decimal" min="0" step="1"
                 placeholder="भुगतान राशि (₹)" data-id="${r.customer.id}">
          <button class="btn pay" data-id="${r.customer.id}">भुगतान दर्ज करें</button>
          ${r.customer.phone ? `<a class="btn linkbtn" href="${reminderLink(r.customer, r.balancePaise)}"
              target="_blank" rel="noopener">WhatsApp पर याद दिलाएं</a>` : ''}
          <p class="pay-status" data-id="${r.customer.id}"></p>
        </div>
      `).join('')}
  `;

  panel.querySelectorAll('.pay').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const input = panel.querySelector(`.pay-amt[data-id="${id}"]`);
      const status = panel.querySelector(`.pay-status[data-id="${id}"]`);
      const amount = Math.round(Number(input.value) * 100);
      if (!(amount > 0)) {
        status.textContent = 'राशि भरें।';
        return;
      }
      await db.put('payments', {
        customerId: id,
        amountPaise: amount,
        date: new Date().toISOString().slice(0, 10)
      });
      await initUdhaar();
    });
  });
}
