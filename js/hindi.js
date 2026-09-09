// Offline Roman -> Devanagari transliteration, tuned for Indian personal names.
// Two layers: the names he actually writes are listed exactly, and anything
// else falls through to phonetic rules that are forgiving rather than
// exhaustive. He can always type in Devanagari directly instead.

// Roman spelling carries no vowel length: "ramu" is रामू and "raghu" is रघु,
// and nothing in the letters says which. Guessing a rule breaks as many names
// as it fixes, so the names actually common in his book are simply listed.
// Anything not here still goes through the phonetic rules below.
//
// Keys are lowercase; several spellings may point at one name.
const NAMES = new Map(Object.entries({
  // पुरुष
  ram: 'राम', raam: 'राम', ramu: 'रामू', raamu: 'रामू',
  shyam: 'श्याम', shaym: 'श्याम', shyamlal: 'श्यामलाल',
  mohan: 'मोहन', sohan: 'सोहन', gopal: 'गोपाल', shankar: 'शंकर',
  ramesh: 'रमेश', suresh: 'सुरेश', mahesh: 'महेश', dinesh: 'दिनेश',
  rajesh: 'राजेश', mukesh: 'मुकेश', rakesh: 'राकेश', naresh: 'नरेश',
  kamlesh: 'कमलेश', brijesh: 'बृजेश', jagdish: 'जगदीश', satish: 'सतीश',
  omprakash: 'ओमप्रकाश', hariom: 'हरिओम', hari: 'हरि', shiv: 'शिव',
  raju: 'राजू', babu: 'बाबू', munna: 'मुन्ना', chhotu: 'छोटू',
  anil: 'अनिल', sunil: 'सुनील', vinod: 'विनोद', pramod: 'प्रमोद',
  ashok: 'अशोक', sanjay: 'संजय', ajay: 'अजय', vijay: 'विजय',
  manoj: 'मनोज', pankaj: 'पंकज', santosh: 'संतोष', deepak: 'दीपक',
  pradeep: 'प्रदीप', sandeep: 'संदीप', rahul: 'राहुल', amit: 'अमित',
  rohit: 'रोहित', mohit: 'मोहित', nitin: 'नितिन', sachin: 'सचिन',
  jitendra: 'जितेंद्र', narendra: 'नरेंद्र', devendra: 'देवेंद्र',
  ravindra: 'रविंद्र', dharmendra: 'धर्मेंद्र', rajendra: 'राजेंद्र',
  nanhelal: 'नन्हे लाल', jagdeesh: 'जगदीश', ramesar: 'रामेश्वर',
  rameshwar: 'रामेश्वर', kamal: 'कमल', vishnu: 'विष्णु', raghu: 'रघु',

  // स्त्री
  sita: 'सीता', seeta: 'सीता', gita: 'गीता', geeta: 'गीता',
  pooja: 'पूजा', puja: 'पूजा', anita: 'अनीता', aneeta: 'अनीता',
  sunita: 'सुनीता', suneeta: 'सुनीता', kavita: 'कविता', babita: 'बबीता',
  mamta: 'ममता', sarita: 'सरिता', rekha: 'रेखा', meena: 'मीना',
  suman: 'सुमन', shanti: 'शांति', kamla: 'कमला', vimla: 'विमला',
  nirmala: 'निर्मला', urmila: 'उर्मिला', sheela: 'शीला', radha: 'राधा',
  laxmi: 'लक्ष्मी', lakshmi: 'लक्ष्मी', saraswati: 'सरस्वती',
  parvati: 'पार्वती', phoolwati: 'फूलवती', ramwati: 'रामवती',
  ramvati: 'रामवती', munni: 'मुन्नी', gudiya: 'गुड़िया', preeti: 'प्रीति',
  neha: 'नेहा', poonam: 'पूनम', rani: 'रानी', meera: 'मीरा',
  asha: 'आशा', usha: 'उषा', kiran: 'किरण', sangita: 'संगीता',
  sangeeta: 'संगीता', savitri: 'सावित्री', shakuntala: 'शकुंतला',
  devi: 'देवी', kumari: 'कुमारी', lal: 'लाल', prasad: 'प्रसाद',
  singh: 'सिंह', kumar: 'कुमार', sharma: 'शर्मा', verma: 'वर्मा',
  gupta: 'गुप्ता', yadav: 'यादव', goyal: 'गोयल'
}));

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
      // A single 'a' after a consonant is the inherent schwa and writes
      // nothing — कमल for "kamal". At the end of a word it is not silent: it
      // is the ा of सीता, पूजा, कमला. Dropping it produced सित and पूज, and
      // those names then failed to match anything in the catalog either.
      const atEnd = i + v[0].length === w.length;
      const matra = (v[0] === 'a' && atEnd) ? 'ा' : v[2];
      out += lastWasConsonant ? matra : v[1];
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
  return text.toLowerCase()
    .split(/(\s+)/)
    .map((p) => (/\s/.test(p) ? p : (NAMES.get(p) ?? word(p))))
    .join('');
}
