// Offline Roman -> Devanagari transliteration, tuned for Indian personal names.
// Deliberately phonetic and forgiving rather than exhaustive: the customer's
// name is typed once and picked from suggestions thereafter, so "close" is
// enough. He can always type in Devanagari directly instead.

const VOWELS = [
  ['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'],
  ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'], ['oo', 'ऊ', 'ू'], ['uu', 'ऊ', 'ू'],
  ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु'],
  ['e', 'ए', 'े'], ['o', 'ओ', 'ो']
];

const CONSONANTS = [
  ['chh', 'छ'], ['shh', 'ष'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'],
  ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'], ['ng', 'ं'],
  ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'],
  ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'],
  ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'],
  ['h', 'ह'], ['f', 'फ'], ['z', 'ज़'], ['c', 'क'], ['q', 'क'], ['x', 'क्स']
];

const HALANT = '्';

function matchAt(table, str, i) {
  for (const row of table) {
    if (str.startsWith(row[0], i)) return row;
  }
  return null;
}

function word(w) {
  let out = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < w.length) {
    const c = matchAt(CONSONANTS, w, i);
    if (c) {
      if (lastWasConsonant) out += HALANT;
      out += c[1];
      i += c[0].length;
      lastWasConsonant = true;
      continue;
    }
    const v = matchAt(VOWELS, w, i);
    if (v) {
      out += lastWasConsonant ? v[2] : v[1];
      i += v[0].length;
      lastWasConsonant = false;
      continue;
    }
    out += w[i];
    i += 1;
    lastWasConsonant = false;
  }
  return out;
}

export function transliterate(text) {
  if (!text) return '';
  // Anything already containing Devanagari is left exactly as typed.
  if (/[ऀ-ॿ]/.test(text)) return text;
  return text.toLowerCase().split(/(\s+)/).map((p) => (/\s/.test(p) ? p : word(p))).join('');
}
