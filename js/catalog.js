import { lineTotal } from './calc.js';

export function validateItem(item) {
  if (!item || !String(item.name || '').trim()) {
    return { ok: false, error: 'डिज़ाइन का नाम भरें।' };
  }
  if (!(Number(item.weight) > 0)) {
    return { ok: false, error: 'वज़न भरें।' };
  }
  return { ok: true };
}

// Catalog prices follow today's bhav rather than being frozen at entry — a
// design's worth moves with the metal. Bills stay frozen; the catalog does not.
export function itemPrice(item, ratePerGram) {
  if (ratePerGram == null) return null;
  return lineTotal({
    weight: Number(item.weight),
    ratePerGram,
    makingPaise: Number(item.makingPaise) || 0
  });
}

// A phone photo is 3-5 MB. Stored raw, a few dozen designs would exhaust the
// browser's storage quota and make the backup file too big to send.
export function fitDimensions(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
