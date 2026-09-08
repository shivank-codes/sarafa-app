import { rupees, hindiDate } from './fmt.js';

// Girvi (pledge) arithmetic. Flat monthly interest on the original principal —
// no compounding — which is how the shop actually lends.

export function monthsBetween(fromISO, toISO) {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);

  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  if (months < 0) months = 0;

  // Days left over after the last completed month.
  const anchor = new Date(Date.UTC(fy, fm - 1 + months, fd));
  const to = Date.UTC(ty, tm - 1, td);
  const days = Math.max(0, Math.round((to - anchor.getTime()) / 86400000));

  return { months, days };
}

// Charged per COMPLETED month. A part month is shown to him separately so he
// can decide whether to round it up — the app does not silently charge for it.
export function interestDue(principalPaise, monthlyRatePercent, months) {
  return Math.round(principalPaise * (monthlyRatePercent / 100) * months);
}

export function totalDue(pledge, months, payments = []) {
  const interestPaise = interestDue(
    pledge.principalPaise, pledge.monthlyRatePercent, months);
  const paidPaise = payments.reduce((s, p) => s + p.amountPaise, 0);
  return {
    interestPaise,
    paidPaise,
    duePaise: pledge.principalPaise + interestPaise - paidPaise
  };
}

// Several states cap total interest at the principal. UP caps the rate rather
// than the total, but interest overtaking the principal is worth flagging: it
// is where a recovery suit starts asking questions.
export function exceedsPrincipal(principalPaise, interestPaise) {
  return interestPaise > principalPaise;
}

// Section 13 of the UP Regulation of Money-Lending Act 1976 requires a receipt
// for EVERY payment, attested by at least one witness, and requires the true
// principal and the lender's registration number on loan documents. Section 15
// lets a court disallow interest where those rules were not followed, so this
// is not paperwork for its own sake.
export function receiptText({ pledge, amountPaise, date, shopName, registrationNo }) {
  return [
    shopName,
    ...(registrationNo ? [`रजिस्ट्रेशन नंबर: ${registrationNo}`] : []),
    '',
    'भुगतान रसीद',
    `दिनांक: ${hindiDate(date)}`,
    `गिरवीकर्ता: ${pledge.pledgerName}`,
    `गिरवी संख्या: ${pledge.id}`,
    `वस्तु: ${pledge.itemDesc} (${pledge.weight} ग्राम)`,
    `गिरवी दिनांक: ${hindiDate(pledge.pledgeDate)}`,
    `मूल रकम: ${rupees(pledge.principalPaise)}`,
    `ब्याज दर: ${pledge.monthlyRatePercent}% प्रति माह`,
    '',
    `प्राप्त राशि: ${rupees(amountPaise)}`,
    '',
    'हस्ताक्षर (दुकानदार): ____________',
    'गवाह का नाम व हस्ताक्षर: ____________'
  ].join('\n');
}
