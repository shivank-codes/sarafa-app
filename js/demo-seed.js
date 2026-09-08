import * as db from './db.js';
import { demoCustomers, demoBills, demoPayments, demoPledges,
         demoPledgePayments, demoItems } from './demo.js';
import { currentRates, todayISO } from './screens/bhav.js';

// Fills the book with the demo records, all tagged demo: true so clearing
// them can never touch a real entry.
//
// Refuses to run twice. Loading the demo a second time would double every
// customer and bill, and on a URL that fills the demo automatically that
// would happen on every refresh.
export async function seedDemo({ withRate = false } = {}) {
  for (const c of await db.all('customers')) {
    if (c.demo === true) return { seeded: false, reason: 'already' };
  }

  let rates = await currentRates();
  if (!rates && withRate) {
    // A demo with no bhav shows भाव भरें where every price should be, which
    // makes the catalog and the bills look broken to someone being shown it.
    rates = { sonaPerGram: 725000, chandiPerGram: 9200 };
    await db.put('rates', { date: todayISO(), ...rates, demo: true });
  }
  const sona = rates ? rates.sonaPerGram : 725000;
  const chandi = rates ? rates.chandiPerGram : 9200;

  const custIds = [];
  for (const c of demoCustomers()) custIds.push(await db.put('customers', c));
  for (const b of demoBills(custIds, sona, chandi)) await db.put('bills', b);
  for (const p of demoPayments(custIds)) await db.put('payments', p);

  const pledgeIds = [];
  for (const p of demoPledges()) pledgeIds.push(await db.put('pledges', p));
  for (const p of demoPledgePayments(pledgeIds)) await db.put('pledgePayments', p);
  for (const it of demoItems()) await db.put('items', it);

  return { seeded: true };
}
