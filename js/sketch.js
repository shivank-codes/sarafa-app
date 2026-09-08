// Placeholder pictures for a design he has not photographed yet.
//
// Where a freely-licensed photograph of that kind of piece exists it is used
// (see img/designs/CREDITS.md — all CC0 or public domain, museum collections);
// otherwise a drawing of the piece on a tray stands in. Both are stand-ins:
// the moment he photographs his own piece, that photo replaces this.
const RULES = [
  [/राखी|rakhi/i, 'rakhi'],
  [/झुमक|कर्णफूल|बाली|jhumk|karnful/i, 'jhumka'],
  [/नथ|लौंग|बुलाक|nath|laung|bulak/i, 'nath'],
  [/अंगूठी|छल्ला|ring|angoothi/i, 'ring'],
  [/कंगन|कड़ा|चूड़ा|छड़ा|तोड़ा|लच्छा|बाजूबंद|kangan|kada|chuda/i, 'bangle'],
  [/पायल|बिछिया|करधनी|तगड़ी|payal|bichhiya|kardhani/i, 'payal'],
  [/सिक्का|coin|sikka/i, 'coin'],
  [/टीका|बोरला|tika|borla/i, 'tika'],
  [/हार|हंसुली|गुलूबंद|हमेल|चंपाकली|haar|hansuli/i, 'haar'],
  [/मंगलसूत्र|mangalsutra/i, 'mangalsutra'],
  [/चेन|कंठी|सुतिया|chain|kanthi/i, 'chain']
];

// Kinds we found a usable free photograph for. The rest keep the drawing.
const PHOTOS = new Set(['jhumka', 'nath', 'ring', 'bangle', 'payal', 'haar', 'chain', 'coin']);

export function sketchFor(name) {
  const n = String(name || '');
  // A transliterated name carries halants — "jhumka" arrives as झुम्का, which
  // does not contain झुमक — so each rule is tried against the stripped form
  // too. Both forms are kept: मंगलसूत्र is only itself with its ्र intact.
  const bare = n.replace(/\u094D/g, '');
  for (const [re, kind] of RULES) {
    if (!re.test(n) && !re.test(bare)) continue;
    return PHOTOS.has(kind)
      ? `img/designs/photos/${kind}.jpg`
      : `img/designs/${kind}.svg`;
  }
  return null;
}
