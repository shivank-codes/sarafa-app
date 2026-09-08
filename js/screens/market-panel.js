import * as db from '../db.js';
import { rupees } from '../fmt.js';
import { fetchMarket, trendOf } from '../market.js';

const MAX_HISTORY = 120;

export async function loadHistory() {
  const rows = await db.all('marketRates');
  return rows.sort((a, b) => a.at.localeCompare(b.at));
}

async function record(reading) {
  await db.put('marketRates', reading);
  const rows = await loadHistory();
  // Keep the file small enough to stay inside a WhatsApp-able backup.
  for (const old of rows.slice(0, Math.max(0, rows.length - MAX_HISTORY))) {
    await db.del('marketRates', old.at);
  }
}

function trendLine(history, field, label) {
  const t = trendOf(history, field);
  if (!t || t.direction === 'same') return '';
  const arrow = t.direction === 'up' ? '▲' : '▼';
  const word = t.direction === 'up' ? 'ऊपर' : 'नीचे';
  return `<div class="row"><span>${label} — पिछले ${t.readings} रीडिंग में</span>
    <strong class="${t.direction}">${arrow} ${rupees(t.deltaPaise)} ${word}</strong></div>`;
}

function render(el, latest, history, state) {
  if (state === 'loading') {
    el.innerHTML = '<p class="muted small">अंतरराष्ट्रीय भाव आ रहा है…</p>';
    return;
  }
  if (!latest) {
    el.innerHTML = `
      <p class="muted small">अंतरराष्ट्रीय भाव अभी नहीं मिला — नेटवर्क न होने पर
         यह सामान्य है। आपका अपना भाव ऊपर वैसे ही चलता रहेगा।</p>
      <button id="mk-refresh" class="btn ghost">फिर से कोशिश करें</button>`;
    return;
  }

  const when = new Date(latest.at).toLocaleString('hi-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  el.innerHTML = `
    <div class="row"><span>सोना (999) — अंतरराष्ट्रीय</span>
      <strong>${rupees(latest.goldPaise)} /ग्राम</strong></div>
    <div class="row"><span>चांदी — अंतरराष्ट्रीय</span>
      <strong>${rupees(latest.silverPaise)} /ग्राम</strong></div>
    <div class="row"><span>डॉलर भाव</span><strong>₹${latest.inrPerUsd}</strong></div>
    ${trendLine(history, 'goldPaise', 'सोना')}
    ${trendLine(history, 'silverPaise', 'चांदी')}
    <p class="muted small">${when} तक · ${history.length} रीडिंग सुरक्षित</p>
    <p class="muted small">यह दुनिया का भाव है, आपका बिक्री भाव नहीं। भारत में
       आयात शुल्क और स्थानीय मंडी का फ़र्क़ इसमें शामिल नहीं है — आगरा का भाव
       इससे अलग रहेगा। बिल हमेशा ऊपर भरे अपने भाव से ही बनेगा।</p>
    <button id="mk-refresh" class="btn ghost">भाव फिर से लें</button>`;
}

export async function initMarketPanel(el) {
  const history = await loadHistory();
  const latest = history.length ? history[history.length - 1] : null;
  render(el, latest, history, 'ready');

  const refresh = async () => {
    render(el, null, history, 'loading');
    try {
      const reading = await fetchMarket();
      await record(reading);
      const h = await loadHistory();
      render(el, reading, h, 'ready');
    } catch {
      const h = await loadHistory();
      render(el, h.length ? h[h.length - 1] : null, h, 'ready');
    }
    const btn = el.querySelector('#mk-refresh');
    if (btn) btn.addEventListener('click', refresh);
  };

  const btn = el.querySelector('#mk-refresh');
  if (btn) btn.addEventListener('click', refresh);

  // Refresh on open when online, and only then — never blocking the counter.
  if (navigator.onLine) {
    const stale = !latest ||
      (Date.now() - new Date(latest.at).getTime()) > 30 * 60 * 1000;
    if (stale) refresh();
  }
}
