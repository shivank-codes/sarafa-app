import * as db from '../db.js';
import { rupees, grams, hindiDate } from '../fmt.js';
import { transliterate } from '../hindi.js';
import { compressImage, blobToDataUrl } from '../photo.js';
import { monthsBetween, totalDue, exceedsPrincipal, receiptText } from '../girvi.js';
import { SHOP_NAME, getRegistrationNo, setRegistrationNo } from '../config.js';
import { todayISO } from './bhav.js';

const ID_TYPES = {
  aadhaar: 'आधार', voter: 'वोटर आईडी', pan: 'पैन',
  driving: 'ड्राइविंग लाइसेंस', other: 'अन्य'
};

async function paymentsFor(pledgeId) {
  return db.byIndex('pledgePayments', 'byPledge', pledgeId);
}

export async function initGirvi() {
  const panel = document.getElementById('panel-girvi');
  const all = await db.all('pledges');
  const active = all.filter((p) => p.status !== 'redeemed');
  const redeemed = all.filter((p) => p.status === 'redeemed');
  const regNo = getRegistrationNo();
  const today = todayISO();

  const rows = await Promise.all(active.map(async (p) => {
    const pays = await paymentsFor(p.id);
    const { months, days } = monthsBetween(p.pledgeDate, today);
    const t = totalDue(p, months, pays);
    return { p, pays, months, days, ...t };
  }));

  const outstanding = rows.reduce((s, r) => s + r.duePaise, 0);

  panel.innerHTML = `
    ${!regNo ? `
      <div class="banner soft">
        मनी-लेंडिंग रजिस्ट्रेशन नंबर भरें — कानून के अनुसार हर रसीद पर ज़रूरी है।
      </div>` : ''}

    <label for="reg-no">रजिस्ट्रेशन नंबर</label>
    <input id="reg-no" type="text" value="${regNo}" placeholder="जैसे: UP/ML/1234">
    <button id="save-reg" class="btn ghost">रजिस्ट्रेशन नंबर सुरक्षित करें</button>

    <h3>कुल गिरवी बकाया</h3>
    <p><span class="total">${rupees(outstanding)}</span>
       <br><small class="muted">${active.length} चालू गिरवी</small></p>

    <h3>नई गिरवी</h3>
    <label for="g-photo" class="btn photo-label">📷 वस्तु की फ़ोटो</label>
    <input id="g-photo" type="file" accept="image/*" capture="environment" hidden>
    <img id="g-preview" class="photo-preview" hidden alt="">

    <label for="g-name">गिरवीकर्ता का नाम</label>
    <input id="g-name" type="text" autocomplete="off" placeholder="जैसे: ramu या रामू">
    <p id="g-name-preview" class="preview"></p>

    <label for="g-phone">मोबाइल नंबर</label>
    <input id="g-phone" type="tel" inputmode="numeric" autocomplete="off">

    <label for="g-idtype">पहचान पत्र</label>
    <select id="g-idtype">
      ${Object.entries(ID_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
    </select>
    <label for="g-idlast4">पहचान पत्र के आख़िरी 4 अंक</label>
    <input id="g-idlast4" type="text" inputmode="numeric" maxlength="4" placeholder="1234">
    <p class="muted small">पूरा नंबर न भरें — फ़ोन खोने पर ग्राहक का नंबर लीक हो सकता है।</p>

    <label for="g-item">वस्तु का विवरण</label>
    <input id="g-item" type="text" placeholder="जैसे: सोने की चेन">
    <label for="g-metal">धातु</label>
    <select id="g-metal"><option value="sona">सोना</option><option value="chandi">चांदी</option></select>
    <label for="g-weight">वज़न (ग्राम)</label>
    <input id="g-weight" type="number" inputmode="decimal" min="0" step="0.001">
    <label for="g-principal">मूल रकम (₹)</label>
    <input id="g-principal" type="number" inputmode="decimal" min="0" step="1">
    <label for="g-rate">ब्याज दर (% प्रति माह)</label>
    <input id="g-rate" type="number" inputmode="decimal" min="0" step="0.25" value="2">
    <button id="g-save" class="btn">गिरवी दर्ज करें</button>
    <p id="g-status" class="warn"></p>

    <h3>चालू गिरवी</h3>
    ${rows.length === 0 ? '<p class="muted">अभी कोई चालू गिरवी नहीं है।</p>' :
      rows.map((r) => `
        <div class="card">
          ${r.p.photo ? `<img class="pledge-photo" src="${r.p.photo}" alt="">` : ''}
          <div class="row"><span><strong>${r.p.pledgerName}</strong><br>
            <small>${r.p.itemDesc} · ${grams(r.p.weight)}</small></span>
            <strong>${rupees(r.duePaise)}</strong></div>
          <div class="row"><span>मूल रकम</span><strong>${rupees(r.p.principalPaise)}</strong></div>
          <div class="row"><span>ब्याज (${r.months} माह × ${r.p.monthlyRatePercent}%)</span>
            <strong>${rupees(r.interestPaise)}</strong></div>
          ${r.days > 0 ? `<p class="muted small">${r.days} दिन और चल रहे हैं — पूरा महीना होने पर ही अगला ब्याज लगेगा।</p>` : ''}
          ${r.paidPaise > 0 ? `<div class="row"><span>अब तक जमा</span>
            <strong>− ${rupees(r.paidPaise)}</strong></div>` : ''}
          ${exceedsPrincipal(r.p.principalPaise, r.interestPaise) ? `
            <p class="warn small">ब्याज मूल रकम से ज़्यादा हो चुका है — वसूली में सवाल उठ सकते हैं।</p>` : ''}
          <p class="muted small">गिरवी दिनांक ${hindiDate(r.p.pledgeDate)} ·
             ${ID_TYPES[r.p.idType] || ''} ····${r.p.idLast4 || ''}</p>
          <input class="g-pay-amt" type="number" inputmode="decimal" min="0" step="1"
                 placeholder="जमा राशि (₹)" data-id="${r.p.id}">
          <button class="btn g-pay" data-id="${r.p.id}">जमा दर्ज करें व रसीद दें</button>
          <button class="btn ghost g-redeem" data-id="${r.p.id}">छुड़ा लिया (वापस कर दी)</button>
          <p class="g-pay-status warn" data-id="${r.p.id}"></p>
        </div>`).join('')}

    ${redeemed.length ? `<h3>छूटी हुई गिरवी (${redeemed.length})</h3>
      ${redeemed.map((p) => `<div class="row"><span>${p.pledgerName}<br>
        <small>${p.itemDesc}</small></span>
        <small class="muted">${p.redeemedDate ? hindiDate(p.redeemedDate) : ''}</small></div>`).join('')}` : ''}
  `;

  panel.querySelector('#save-reg').addEventListener('click', () => {
    setRegistrationNo(panel.querySelector('#reg-no').value.trim());
    initGirvi();
  });

  const nameInput = panel.querySelector('#g-name');
  nameInput.addEventListener('input', () => {
    const raw = nameInput.value.trim();
    const hi = transliterate(raw);
    panel.querySelector('#g-name-preview').textContent =
      (raw && hi !== raw) ? `हिंदी में: ${hi}` : '';
  });

  let photoDataUrl = null;
  const status = panel.querySelector('#g-status');
  panel.querySelector('#g-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    status.textContent = 'फ़ोटो तैयार हो रही है…';
    try {
      photoDataUrl = await blobToDataUrl(await compressImage(file));
      const prev = panel.querySelector('#g-preview');
      prev.src = photoDataUrl;
      prev.hidden = false;
      status.textContent = '';
    } catch {
      status.textContent = 'फ़ोटो नहीं पढ़ी जा सकी।';
    }
  });

  panel.querySelector('#g-save').addEventListener('click', async () => {
    const name = transliterate(nameInput.value.trim());
    const itemDesc = panel.querySelector('#g-item').value.trim();
    const weight = Number(panel.querySelector('#g-weight').value);
    const principalPaise = Math.round(Number(panel.querySelector('#g-principal').value) * 100);
    const rate = Number(panel.querySelector('#g-rate').value);

    if (!name) { status.textContent = 'गिरवीकर्ता का नाम भरें।'; return; }
    if (!itemDesc) { status.textContent = 'वस्तु का विवरण भरें।'; return; }
    if (!(weight > 0)) { status.textContent = 'वज़न भरें।'; return; }
    if (!(principalPaise > 0)) { status.textContent = 'मूल रकम भरें।'; return; }
    if (!(rate >= 0)) { status.textContent = 'ब्याज दर भरें।'; return; }

    await db.put('pledges', {
      pledgerName: name,
      phone: panel.querySelector('#g-phone').value.trim(),
      idType: panel.querySelector('#g-idtype').value,
      idLast4: panel.querySelector('#g-idlast4').value.trim().slice(-4),
      itemDesc,
      metal: panel.querySelector('#g-metal').value,
      weight,
      principalPaise,
      monthlyRatePercent: rate,
      photo: photoDataUrl,
      pledgeDate: today,
      status: 'active'
    });
    await initGirvi();
  });

  // Every payment produces a receipt, because s.13 requires one — attested by
  // a witness, stating the true principal and the registration number.
  panel.querySelectorAll('.g-pay').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const input = panel.querySelector(`.g-pay-amt[data-id="${id}"]`);
      const st = panel.querySelector(`.g-pay-status[data-id="${id}"]`);
      const amountPaise = Math.round(Number(input.value) * 100);
      if (!(amountPaise > 0)) { st.textContent = 'राशि भरें।'; return; }

      const pledge = await db.get('pledges', id);
      await db.put('pledgePayments', { pledgeId: id, amountPaise, date: today });

      const text = receiptText({
        pledge, amountPaise, date: today,
        shopName: SHOP_NAME, registrationNo: getRegistrationNo()
      });
      try {
        await navigator.share({ text, title: 'भुगतान रसीद' });
      } catch (err) {
        if (!err || err.name !== 'AbortError') {
          window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        }
      }
      await initGirvi();
    });
  });

  panel.querySelectorAll('.g-redeem').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.armed !== 'yes') {
        btn.dataset.armed = 'yes';
        btn.textContent = 'पक्का? वस्तु वापस कर दी';
        setTimeout(() => {
          if (btn.isConnected) {
            btn.dataset.armed = '';
            btn.textContent = 'छुड़ा लिया (वापस कर दी)';
          }
        }, 4000);
        return;
      }
      const p = await db.get('pledges', Number(btn.dataset.id));
      await db.put('pledges', { ...p, status: 'redeemed', redeemedDate: today });
      await initGirvi();
    });
  });
}
