// Villages and towns in and around Awagarh, Etah district — for tagging
// customers so accounts can be filtered by place, the way he thinks about
// them ("Marehra walon ka kitna baaki hai").
//
// From general knowledge of the area, not an official revenue list. He can
// type any place not here, and whatever he types is remembered.
export const VILLAGES = [
  'अवागढ़',
  'अलीगंज',
  'अमांपुर',
  'एटा',
  'कासगंज',
  'जलेसर',
  'जैथरा',
  'निधौली कलां',
  'नयागांव',
  'पटियाली',
  'मारहरा',
  'मिरहची',
  'राजा का रामपुर',
  'सकीत',
  'सहावर',
  'सिढ़पुरा',
  'सोरों',
  'गंज डुंडवारा',
  'बिलराम',
  'शीतलपुर'
].sort((a, b) => a.localeCompare(b, 'hi'));

// Older customers were stored as "नाम (गाँव)". Pull the village back out so
// filtering works for them too, without a migration.
export function villageOf(customer) {
  if (customer.village) return customer.village;
  const m = /\(([^)]+)\)\s*$/.exec(customer.name || '');
  return m ? m[1].trim() : '';
}

export function displayName(customer) {
  if (customer.village && !/\([^)]+\)\s*$/.test(customer.name)) {
    return `${customer.name} (${customer.village})`;
  }
  return customer.name;
}

export function filterCustomers(customers, { village = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return customers.filter((c) => {
    if (village && villageOf(c) !== village) return false;
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) ||
           (c.phone || '').includes(q) ||
           villageOf(c).toLowerCase().includes(q);
  });
}

// Every village that actually appears in his book, so the filter offers the
// places he really deals with rather than a fixed list.
export function villagesInUse(customers) {
  const seen = new Set(customers.map(villageOf).filter(Boolean));
  return [...seen].sort((a, b) => a.localeCompare(b, 'hi'));
}
