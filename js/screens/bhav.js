import * as db from '../db.js';
import { rupees, hindiDate } from '../fmt.js';

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function currentRates() {
  const row = await db.get('rates', todayISO());
  return row ? { sonaPerGram: row.sonaPerGram, chandiPerGram: row.chandiPerGram } : null;
}

export async function initBhav() {
  const panel = document.getElementById('panel-bhav');
  const today = todayISO();
  const saved = await currentRates();

  panel.innerHTML = `
    <p>${hindiDate(today)}</p>
    <label for="sona">सोना — भाव प्रति ग्राम</label>
    <input id="sona" type="number" inputmode="decimal" min="0" step="1">
    <label for="chandi">चांदी — भाव प्रति ग्राम</label>
    <input id="chandi" type="number" inputmode="decimal" min="0" step="0.01">
    <button id="save-bhav" class="btn">आज का भाव सुरक्षित करें</button>
    <p id="bhav-status"></p>
  `;

  const sona = panel.querySelector('#sona');
  const chandi = panel.querySelector('#chandi');
  const status = panel.querySelector('#bhav-status');

  if (saved) {
    sona.value = saved.sonaPerGram / 100;
    chandi.value = saved.chandiPerGram / 100;
    status.textContent = `आज का भाव तय है — सोना ${rupees(saved.sonaPerGram)}, चांदी ${rupees(saved.chandiPerGram)}`;
  } else {
    status.textContent = 'आज का भाव अभी तय नहीं हुआ है।';
  }

  panel.querySelector('#save-bhav').addEventListener('click', async () => {
    const s = Math.round(Number(sona.value) * 100);
    const c = Math.round(Number(chandi.value) * 100);
    if (!(s > 0) || !(c > 0)) {
      status.textContent = 'कृपया सोना और चांदी दोनों का भाव भरें।';
      return;
    }
    await db.put('rates', { date: today, sonaPerGram: s, chandiPerGram: c });
    status.textContent = `भाव सुरक्षित — सोना ${rupees(s)}, चांदी ${rupees(c)}`;
  });
}
