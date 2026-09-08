// Jewellery pricing as a sarafa actually computes it.
//
// The daily bhav is quoted for fine gold (999). Jewellery sells at 22K, 18K
// or 14K, so the selling rate is derived from the bhav by purity. Charging the
// 999 rate on a 22K piece overcharges by about 9%.

export const PURITY = {
  '24': 0.999,
  '22': 0.916,
  '18': 0.750,
  '14': 0.585
};

export function rateForPurity(base999Paise, karat) {
  const factor = PURITY[String(karat)];
  if (factor == null) return base999Paise;
  // The quoted bhav is itself for 999 fineness, so scale relative to that.
  return Math.round(base999Paise * (factor / PURITY['24']));
}

// Three ways a shop quotes making: a flat amount, an amount per gram, or a
// percentage of the metal value. Per-gram and percentage are the common ones.
export function makingCharge(making, weight, metalPaise) {
  if (!making) return 0;
  const v = Number(making.value) || 0;
  if (making.mode === 'per_gram') return Math.round(v * 100 * weight);
  if (making.mode === 'percent') return Math.round(metalPaise * (v / 100));
  return Math.round(v * 100);
}

export function saleTotal({
  weight, base999Paise, karat, making,
  oldGoldPaise = 0, gstPercent = 0
}) {
  const ratePerGram = karat ? rateForPurity(base999Paise, karat) : base999Paise;
  const metalPaise = Math.round(weight * ratePerGram);
  const makingPaise = makingCharge(making, weight, metalPaise);
  const beforeTax = metalPaise + makingPaise;
  const gstPaise = Math.round(beforeTax * (Number(gstPercent) || 0) / 100);
  const totalPaise = Math.max(0, beforeTax + gstPaise - (oldGoldPaise || 0));

  return { ratePerGram, metalPaise, makingPaise, gstPaise,
           oldGoldPaise: oldGoldPaise || 0, totalPaise };
}
