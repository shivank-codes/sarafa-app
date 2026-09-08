import * as db from '../db.js';
import { rupees, hindiDate, grams } from '../fmt.js';
import { daySummary, rateChange } from '../day.js';
import { initMarketPanel } from './market-panel.js';

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function currentRates() {
  const row = await db.get('rates', todayISO());
  return row ? { sonaPerGram: row.sonaPerGram, chandiPerGram: row.chandiPerGram } : null;
}

async function previousRate() {
  const all = (await db.all('rates')).sort((a, b) => a.date.localeCompare(b.date));
  const before = all.filter((r) => r.date < todayISO());
  return before.length ? before[before.length - 1] : null;
}

const METAL = { sona: 'सोना', chandi: 'चांदी' };

function changeLabel(todayPaise, prev) {
  const ch = rateChange(todayPaise, prev);
  if (!ch || ch.direction === 'same') return '';
  const arrow = ch.direction === 'up' ? '▲' : '▼';
  const word = ch.direction === 'up' ? 'ऊपर' : 'नीचे';
  return ` <span class="${ch.direction}">${arrow} ${rupees(ch.deltaPaise)} ${word}</span>`;
}

export async function initBhav() {
  const panel = document.getElementById('panel-bhav');
  const today = todayISO();
  const saved = await currentRates();
  const prev = await previousRate();
  const bills = await db.byIndex('bills', 'byDate', today);
  const sum = daySummary(bills, today);

  panel.innerHTML = `
    <p class="muted">${hindiDate(today)}</p>

    ${!saved && prev ? `
      <div class="notice">
        <p>${hindiDate(prev.date)} का भाव — सोना ${rupees(prev.sonaPerGram)},
           चांदी ${rupees(prev.chandiPerGram)}</p>
        <button id="carry" class="btn ghost">वही भाव आज भी लगाएं</button>
      </div>` : ''}

    <label for="sona">सोना — भाव प्रति ग्राम (999 / 24 कैरेट)</label>
    <input id="sona" type="number" inputmode="decimal" min="0" step="1">
    <label for="chandi">चांदी — भाव प्रति किलो</label>
    <input id="chandi" type="number" inputmode="decimal" min="0" step="100"
           placeholder="जैसे: 92000">
    <p id="chandi-per-gram" class="muted small"></p>
    <button id="save-bhav" class="btn">आज का भाव सुरक्षित करें</button>
    <p id="bhav-status"></p>

    <h3>अंतरराष्ट्रीय भाव (सिर्फ़ जानकारी के लिए)</h3>
    <div id="market-panel" class="breakup"></div>

    <h3>आज की बिक्री</h3>
    <p>कुल: <span class="total">${rupees(sum.totalPaise)}</span></p>
    <div class="row"><span>नकद</span><strong>${rupees(sum.nakadPaise)}</strong></div>
    <div class="row"><span>उधार</span><strong>${rupees(sum.udhaarPaise)}</strong></div>
    <div class="row"><span>कुल बिल</span><strong>${sum.count}</strong></div>

    ${bills.length === 0 ? '<p class="muted">आज अभी कोई बिल नहीं बना।</p>' :
      bills.slice().reverse().map((b) => `
        <div class="row">
          <span>${METAL[b.metal]} ${grams(b.weight)}<br>
            <small>${b.settlement === 'nakad' ? 'नकद' : 'उधार'}</small></span>
          <span class="right">
            <strong>${rupees(b.totalPaise)}</strong><br>
            <button class="link-danger del-bill" data-id="${b.id}">हटाएं</button>
          </span>
        </div>`).join('')}
  `;

  initMarketPanel(panel.querySelector('#market-panel'));

  const sona = panel.querySelector('#sona');
  const chandi = panel.querySelector('#chandi');
  const status = panel.querySelector('#bhav-status');

  if (saved) {
    sona.value = saved.sonaPerGram / 100;
    chandi.value = (saved.chandiPerGram / 100) * 1000;
    status.innerHTML = `आज का भाव तय है — सोना ${rupees(saved.sonaPerGram)}` +
      changeLabel(saved.sonaPerGram, prev ? prev.sonaPerGram : null) +
      `, चांदी ${rupees(saved.chandiPerGram)}`;
  } else {
    status.textContent = 'आज का भाव अभी तय नहीं हुआ है।';
  }

  const carry = panel.querySelector('#carry');
  if (carry) {
    carry.addEventListener('click', () => {
      sona.value = prev.sonaPerGram / 100;
      chandi.value = (prev.chandiPerGram / 100) * 1000;
      panel.querySelector('#save-bhav').click();
    });
  }

  const perGramNote = panel.querySelector('#chandi-per-gram');
  const echoChandi = () => {
    const perKilo = Number(chandi.value) || 0;
    perGramNote.textContent = perKilo > 0
      ? `= ${rupees(Math.round(perKilo * 100 / 1000))} प्रति ग्राम`
      : '';
  };
  chandi.addEventListener('input', echoChandi);
  echoChandi();

  panel.querySelector('#save-bhav').addEventListener('click', async () => {
    const s = Math.round(Number(sona.value) * 100);
    // Silver is quoted per kilo in India. Storing per gram keeps every other
    // calculation uniform, and typing 92 when he means 92,000 would otherwise
    // be a silent 1000x error.
    const c = Math.round((Number(chandi.value) * 100) / 1000);
    if (!(s > 0) || !(c > 0)) {
      status.textContent = 'कृपया सोना और चांदी दोनों का भाव भरें।';
      return;
    }
    await db.put('rates', { date: today, sonaPerGram: s, chandiPerGram: c });
    await initBhav();
  });

  // Two-tap delete: the first tap arms it, the second removes. A mis-entered
  // bill has to be fixable, but not by a single stray touch at the counter.
  panel.querySelectorAll('.del-bill').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.armed !== 'yes') {
        btn.dataset.armed = 'yes';
        btn.textContent = 'पक्का? हटाएं';
        setTimeout(() => {
          if (btn.isConnected) { btn.dataset.armed = ''; btn.textContent = 'हटाएं'; }
        }, 4000);
        return;
      }
      await db.del('bills', Number(btn.dataset.id));
      await initBhav();
    });
  });
}
