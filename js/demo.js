// Demo data for trying the app out before it holds anything real.
//
// Every record carries `demo: true`. Removal deletes only tagged records, so
// clearing the demo can never touch a genuine bill, pledge or customer.
//
// Villages are places in and around Awagarh in Etah district, from general
// knowledge — not verified against his actual customer book. He should expect
// to delete all of this and enter his own.

const VILLAGES = [
  'अवागढ़', 'मारहरा', 'जलेसर', 'सकीत', 'निधौली कलां',
  'अलीगंज', 'जैथरा', 'राजा का रामपुर', 'सोरों', 'अमांपुर'
];

const PEOPLE = [
  { name: 'रामू', village: 'अवागढ़', phone: '9876543210' },
  { name: 'श्यामलाल', village: 'मारहरा', phone: '9451122334' },
  { name: 'मुन्नी देवी', village: 'जलेसर', phone: '9838011223' },
  { name: 'ओमप्रकाश', village: 'सकीत', phone: '9917445566' },
  { name: 'रामवती देवी', village: 'निधौली कलां', phone: '9634778899' },
  { name: 'हरिओम', village: 'अलीगंज', phone: '9219336677' },
  { name: 'सुनीता देवी', village: 'जैथरा', phone: '9720554433' },
  { name: 'जगदीश', village: 'राजा का रामपुर', phone: '9358227744' },
  { name: 'कमलेश', village: 'सोरों', phone: '9536889900' },
  { name: 'फूलवती', village: 'अमांपुर', phone: '9412663355' },
  { name: 'नन्हे लाल', village: 'अवागढ़', phone: '9808112255' },
  { name: 'रामेश्वर', village: 'मारहरा', phone: '9634001199' }
];

export const DEMO_VILLAGES = VILLAGES;

// Named the way a village shopkeeper actually keeps them: person, then place.
export function demoCustomers() {
  return PEOPLE.map((p) => ({
    name: `${p.name} (${p.village})`,
    village: p.village,
    phone: p.phone,
    demo: true
  }));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Sales spread over the last two weeks: mostly small silver, a few gold
// pieces, roughly the mix a rural sarafa sees.
export function demoBills(customerIds, sonaRate, chandiRate) {
  const spec = [
    { d: 12, metal: 'chandi', w: 45, mk: 25000, s: 'nakad',  c: null },
    { d: 11, metal: 'sona',   w: 4,  mk: 100000, s: 'udhaar', c: 0 },
    { d: 10, metal: 'chandi', w: 12, mk: 8000,  s: 'nakad',  c: null },
    { d: 9,  metal: 'sona',   w: 10, mk: 180000, s: 'udhaar', c: 2 },
    { d: 8,  metal: 'chandi', w: 90, mk: 30000, s: 'nakad',  c: null },
    { d: 6,  metal: 'sona',   w: 6,  mk: 140000, s: 'nakad',  c: null },
    { d: 5,  metal: 'chandi', w: 70, mk: 28000, s: 'udhaar', c: 4 },
    { d: 4,  metal: 'sona',   w: 14, mk: 250000, s: 'udhaar', c: 6 },
    { d: 3,  metal: 'chandi', w: 8,  mk: 15000, s: 'nakad',  c: null },
    { d: 2,  metal: 'sona',   w: 3,  mk: 90000, s: 'udhaar', c: 8 },
    { d: 1,  metal: 'chandi', w: 140, mk: 42000, s: 'nakad', c: null },
    { d: 0,  metal: 'sona',   w: 5,  mk: 120000, s: 'udhaar', c: 10 }
  ];
  return spec.map((b) => {
    const rate = b.metal === 'sona' ? sonaRate : chandiRate;
    return {
      date: daysAgo(b.d),
      metal: b.metal,
      weight: b.w,
      ratePerGram: rate,
      makingPaise: b.mk,
      totalPaise: Math.round(b.w * rate) + b.mk,
      settlement: b.s,
      customerId: b.c == null ? null : customerIds[b.c],
      demo: true
    };
  });
}

// Part-payments, so some khatas are settled and some are not.
export function demoPayments(customerIds) {
  return [
    { customerId: customerIds[0], amountPaise: 500000, date: daysAgo(7), demo: true },
    { customerId: customerIds[2], amountPaise: 2000000, date: daysAgo(5), demo: true },
    { customerId: customerIds[4], amountPaise: 300000, date: daysAgo(2), demo: true }
  ];
}

// Pledges of the kind a village pawnbroker actually takes: modest sums
// against household gold, running a few months.
export function demoPledges() {
  return [
    { pledgerName: 'रामवती देवी (निधौली कलां)', phone: '9634778899',
      idType: 'aadhaar', idLast4: '4417', itemDesc: 'सोने की चेन',
      metal: 'sona', weight: 10, principalPaise: 5000000,
      monthlyRatePercent: 2, photo: null, pledgeDate: daysAgo(98),
      status: 'active', demo: true },
    { pledgerName: 'जगदीश (राजा का रामपुर)', phone: '9358227744',
      idType: 'voter', idLast4: '8823', itemDesc: 'कंगन (जोड़ी)',
      metal: 'sona', weight: 22, principalPaise: 11000000,
      monthlyRatePercent: 2, photo: null, pledgeDate: daysAgo(62),
      status: 'active', demo: true },
    { pledgerName: 'नन्हे लाल (अवागढ़)', phone: '9808112255',
      idType: 'aadhaar', idLast4: '1190', itemDesc: 'चांदी की करधनी',
      metal: 'chandi', weight: 200, principalPaise: 1200000,
      monthlyRatePercent: 2.5, photo: null, pledgeDate: daysAgo(35),
      status: 'active', demo: true },
    { pledgerName: 'फूलवती (अमांपुर)', phone: '9412663355',
      idType: 'other', idLast4: '', itemDesc: 'सोने की नथ',
      metal: 'sona', weight: 3, principalPaise: 1500000,
      monthlyRatePercent: 2, photo: null, pledgeDate: daysAgo(140),
      status: 'redeemed', redeemedDate: daysAgo(20), demo: true }
  ];
}

export function demoPledgePayments(pledgeIds) {
  return [
    { pledgeId: pledgeIds[0], amountPaise: 200000, date: daysAgo(35), demo: true },
    { pledgeId: pledgeIds[1], amountPaise: 440000, date: daysAgo(10), demo: true }
  ];
}
