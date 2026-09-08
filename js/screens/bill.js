import * as db from '../db.js';
import { rupees } from '../fmt.js';
import { saleTotal, PURITY } from '../pricing.js';
import { currentRates, todayISO } from './bhav.js';

const KARATS = [
  ['22', '22 कैरेट (916)'],
  ['24', '24 कैरेट (999)'],
  ['18', '18 कैरेट (750)'],
  ['14', '14 कैरेट (585)']
];

const MAKING_MODES = [
  ['per_gram', 'प्रति ग्राम (₹/ग्राम)'],
  ['percent', 'प्रतिशत (%)'],
  ['flat', 'एकमुश्त (₹)']
];

async function nextBillNo() {
  const bills = await db.all('bills');
  const max = bills.reduce((m, b) => Math.max(m, Number(b.billNo) || 0), 0);
  return max + 1;
}

export async function initBill() {
  const panel = document.getElementById('panel-bill');
  const rates = await currentRates();

  if (!rates) {
    panel.innerHTML = '<p>पहले आज का भाव भरें। नीचे "भाव" पर जाएँ।</p>';
    return;
  }

  const customers = await db.all('customers');
  const billNo = await nextBillNo();

  panel.innerHTML = `
    <p class="muted">बिल नंबर ${billNo}</p>

    <label for="metal">धातु</label>
    <select id="metal">
      <option value="sona">सोना</option>
      <option value="chandi">चांदी</option>
    </select>

    <div id="karat-row">
      <label for="karat">शुद्धता</label>
      <select id="karat">
        ${KARATS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}
      </select>
    </div>

    <label for="weight">वज़न (ग्राम)</label>
    <input id="weight" type="number" inputmode="decimal" min="0" step="0.001">

    <label for="making-mode">मजदूरी का तरीक़ा</label>
    <select id="making-mode">
      ${MAKING_MODES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}
    </select>
    <label for="making">मजदूरी</label>
    <input id="making" type="number" inputmode="decimal" min="0" step="1" value="0">

    <label for="oldgold">पुराना सोना/चांदी वापस (₹)</label>
    <input id="oldgold" type="number" inputmode="decimal" min="0" step="1" value="0">

    <label for="gst">जीएसटी (%)</label>
    <input id="gst" type="number" inputmode="decimal" min="0" step="0.5" value="0">

    <div class="breakup">
      <div class="row"><span>आज का भाव (999)</span><strong id="bk-base"></strong></div>
      <div class="row"><span>इस शुद्धता का भाव</span><strong id="bk-rate"></strong></div>
      <div class="row"><span>धातु</span><strong id="bk-metal"></strong></div>
      <div class="row"><span>मजदूरी</span><strong id="bk-making"></strong></div>
      <div class="row" id="bk-gst-row"><span>जीएसटी</span><strong id="bk-gst"></strong></div>
      <div class="row" id="bk-old-row"><span>पुराना वापस</span><strong id="bk-old"></strong></div>
    </div>
    <p>कुल: <span id="bill-total" class="total">₹0</span></p>

    <button id="save-nakad" class="btn">नकद</button>
    <label for="cust">उधार — ग्राहक</label>
    <select id="cust">
      <option value="">— ग्राहक चुनें —</option>
      ${customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
    </select>
    <button id="save-udhaar" class="btn">उधार लिखें</button>
    <p id="bill-status" class="warn"></p>
  `;

  const $ = (id) => panel.querySelector('#' + id);
  const metal = $('metal');
  const karatRow = $('karat-row');
  const status = $('bill-status');

  const isGold = () => metal.value === 'sona';

  function compute() {
    const base = isGold() ? rates.sonaPerGram : rates.chandiPerGram;
    return saleTotal({
      weight: Number($('weight').value) || 0,
      base999Paise: base,
      karat: isGold() ? $('karat').value : null,
      making: { mode: $('making-mode').value, value: Number($('making').value) || 0 },
      oldGoldPaise: Math.round((Number($('oldgold').value) || 0) * 100),
      gstPercent: Number($('gst').value) || 0
    });
  }

  function refresh() {
    karatRow.hidden = !isGold();
    const base = isGold() ? rates.sonaPerGram : rates.chandiPerGram;
    const r = compute();
    $('bk-base').textContent = rupees(base) + ' /ग्राम';
    $('bk-rate').textContent = rupees(r.ratePerGram) + ' /ग्राम';
    $('bk-metal').textContent = rupees(r.metalPaise);
    $('bk-making').textContent = rupees(r.makingPaise);
    $('bk-gst').textContent = rupees(r.gstPaise);
    $('bk-old').textContent = '− ' + rupees(r.oldGoldPaise);
    $('bk-gst-row').hidden = r.gstPaise === 0;
    $('bk-old-row').hidden = r.oldGoldPaise === 0;
    $('bill-total').textContent = rupees(r.totalPaise);
  }

  ['metal', 'karat', 'weight', 'making-mode', 'making', 'oldgold', 'gst']
    .forEach((id) => {
      const el = $(id);
      el.addEventListener('input', refresh);
      el.addEventListener('change', refresh);
    });
  refresh();

  async function save(settlement, customerId) {
    const w = Number($('weight').value);
    if (!(w > 0)) { status.textContent = 'वज़न भरें।'; return; }
    if (settlement === 'udhaar' && !customerId) {
      status.textContent = 'उधार के लिए ग्राहक चुनें।';
      return;
    }
    const r = compute();
    if (r.totalPaise === 0 && r.oldGoldPaise > 0) {
      status.textContent = 'पुराने की क़ीमत कुल से ज़्यादा है — जाँच लें।';
      return;
    }

    await db.put('bills', {
      billNo: await nextBillNo(),
      date: todayISO(),
      metal: metal.value,
      karat: isGold() ? $('karat').value : null,
      weight: w,
      ratePerGram: r.ratePerGram,
      base999Paise: isGold() ? rates.sonaPerGram : rates.chandiPerGram,
      makingMode: $('making-mode').value,
      makingValue: Number($('making').value) || 0,
      makingPaise: r.makingPaise,
      gstPercent: Number($('gst').value) || 0,
      gstPaise: r.gstPaise,
      oldGoldPaise: r.oldGoldPaise,
      totalPaise: r.totalPaise,
      settlement,
      customerId: customerId || null
    });

    status.textContent = `बिल ${await nextBillNo() - 1} सुरक्षित — ${rupees(r.totalPaise)}`;
    $('weight').value = '';
    $('oldgold').value = '0';
    refresh();
    const label = panel.querySelector('.muted');
    if (label) label.textContent = `बिल नंबर ${await nextBillNo()}`;
  }

  $('save-nakad').addEventListener('click', () => save('nakad', null));
  $('save-udhaar').addEventListener('click', () =>
    save('udhaar', Number($('cust').value) || null));
}
