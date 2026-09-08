import * as db from '../db.js';
import { rupees, grams } from '../fmt.js';
import { transliterate } from '../hindi.js';
import { validateItem, itemPrice } from '../catalog.js';
import { compressImage, blobToDataUrl } from '../photo.js';
import { currentRates } from './bhav.js';
import { SHOP_NAME } from '../config.js';
import { SAMPLE_ITEMS, REGIONAL_ITEMS } from '../samples.js';
import { sketchFor } from '../sketch.js';

const METAL = { sona: 'सोना', chandi: 'चांदी' };

function priceLine(item, rates) {
  const rate = rates ? (item.metal === 'sona' ? rates.sonaPerGram : rates.chandiPerGram) : null;
  const p = itemPrice(item, rate);
  return p == null ? 'भाव भरें' : rupees(p);
}

export async function initDesign() {
  const panel = document.getElementById('panel-design');
  const items = await db.all('items');
  const rates = await currentRates();

  panel.innerHTML = `
    <h3>नया डिज़ाइन</h3>
    <label for="d-photo" class="btn photo-label">📷 फ़ोटो लें या चुनें</label>
    <input id="d-photo" type="file" accept="image/*" capture="environment" hidden>
    <img id="d-preview" class="photo-preview" hidden alt="">
    <label for="d-name">डिज़ाइन का नाम</label>
    <input id="d-name" type="text" autocomplete="off" placeholder="जैसे: haar या हार">
    <p id="d-name-preview" class="preview"></p>
    <label for="d-metal">धातु</label>
    <select id="d-metal">
      <option value="sona">सोना</option>
      <option value="chandi">चांदी</option>
    </select>
    <label for="d-weight">वज़न (ग्राम)</label>
    <input id="d-weight" type="number" inputmode="decimal" min="0" step="0.001">
    <label for="d-making">मजदूरी (₹)</label>
    <input id="d-making" type="number" inputmode="decimal" min="0" step="1" value="0">
    <button id="d-save" class="btn">डिज़ाइन जोड़ें</button>
    <p id="d-status" class="warn"></p>

    <h3>कैटलॉग — ${items.length} डिज़ाइन</h3>
    <div class="notice">
      <p>नमूना डिज़ाइन जोड़ें — वज़न और मजदूरी अपने हिसाब से बदल लें,
         और फ़ोटो अपनी लगाएं। जो पहले से हैं वे दोबारा नहीं जुड़ेंगे।</p>
      <button id="d-samples" class="btn ghost">आम डिज़ाइन (${SAMPLE_ITEMS.length})</button>
      <button id="d-regional" class="btn ghost">इस इलाके के पारंपरिक डिज़ाइन (${REGIONAL_ITEMS.length})</button>
    </div>
    ${!rates ? '<p class="muted">आज का भाव भरें, तभी दाम दिखेंगे।</p>' : ''}
    ${items.length === 0 ? '<p class="muted">अभी कोई डिज़ाइन नहीं है।</p>' : `
      <div class="grid">
        ${items.slice().reverse().map((it) => `
          <div class="card item">
            ${it.photo
              ? `<img src="${it.photo}" alt="${it.name}" loading="lazy">`
              : (sketchFor(it.name)
                  ? `<img class="sketch" src="${sketchFor(it.name)}" alt="" loading="lazy">`
                  : '')}
            <strong>${it.name}</strong>
            <small>${METAL[it.metal]} · ${grams(it.weight)}</small>
            <span class="price">${priceLine(it, rates)}</span>
            <button class="btn ghost share-item" data-id="${it.id}">भेजें</button>
            <button class="link-danger del-item" data-id="${it.id}">हटाएं</button>
          </div>`).join('')}
      </div>`}
  `;

  const photoInput = panel.querySelector('#d-photo');
  const preview = panel.querySelector('#d-preview');
  const status = panel.querySelector('#d-status');
  const nameInput = panel.querySelector('#d-name');
  let photoDataUrl = null;

  nameInput.addEventListener('input', () => {
    const raw = nameInput.value.trim();
    const hi = transliterate(raw);
    panel.querySelector('#d-name-preview').textContent =
      (raw && hi !== raw) ? `हिंदी में: ${hi}` : '';
  });

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    status.textContent = 'फ़ोटो तैयार हो रही है…';
    try {
      const blob = await compressImage(file);
      photoDataUrl = await blobToDataUrl(blob);
      preview.src = photoDataUrl;
      preview.hidden = false;
      status.textContent = '';
    } catch {
      status.textContent = 'फ़ोटो नहीं पढ़ी जा सकी। दूसरी फ़ोटो लें।';
    }
  });

  panel.querySelector('#d-save').addEventListener('click', async () => {
    const item = {
      name: transliterate(nameInput.value.trim()),
      metal: panel.querySelector('#d-metal').value,
      weight: Number(panel.querySelector('#d-weight').value),
      makingPaise: Math.round((Number(panel.querySelector('#d-making').value) || 0) * 100),
      photo: photoDataUrl,
      createdAt: new Date().toISOString()
    };
    const check = validateItem(item);
    if (!check.ok) { status.textContent = check.error; return; }
    await db.put('items', item);
    await initDesign();
  });

  // Sharing a design opens WhatsApp with the photo and price already filled
  // in. He picks the customer and taps send — the app never sends anything.
  // Adding a sample set twice must not duplicate the catalog, so anything
  // already present by name is skipped.
  async function seed(list) {
    const existing = new Set((await db.all('items')).map((i) => i.name));
    const now = new Date().toISOString();
    let added = 0;
    for (const it of list) {
      if (existing.has(it.name)) continue;
      await db.put('items', { ...it, photo: null, createdAt: now });
      added += 1;
    }
    await initDesign();
    const s = document.getElementById('d-status');
    if (s) s.textContent = added ? `${added} डिज़ाइन जुड़े।` : 'ये सब पहले से मौजूद हैं।';
  }

  panel.querySelector('#d-samples').addEventListener('click', () => seed(SAMPLE_ITEMS));
  panel.querySelector('#d-regional').addEventListener('click', () => seed(REGIONAL_ITEMS));

  panel.querySelectorAll('.share-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const it = await db.get('items', Number(btn.dataset.id));
      const text =
        `${it.name} — ${METAL[it.metal]}, ${grams(it.weight)}\n` +
        `दाम: ${priceLine(it, rates)}\n${SHOP_NAME}`;
      try {
        if (it.photo && navigator.canShare) {
          const blob = await (await fetch(it.photo)).blob();
          const file = new File([blob], `${it.name}.jpg`, { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text });
            return;
          }
        }
        await navigator.share({ text });
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
      }
    });
  });

  panel.querySelectorAll('.del-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.armed !== 'yes') {
        btn.dataset.armed = 'yes';
        btn.textContent = 'पक्का? हटाएं';
        setTimeout(() => {
          if (btn.isConnected) { btn.dataset.armed = ''; btn.textContent = 'हटाएं'; }
        }, 4000);
        return;
      }
      await db.del('items', Number(btn.dataset.id));
      await initDesign();
    });
  });
}
