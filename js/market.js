// International spot rates, for reference beside his own bhav.
//
// Two free, key-less, CORS-open sources:
//   api.gold-api.com      — XAU/XAG spot in USD per troy ounce
//   api.frankfurter.dev   — USD/INR (ECB daily reference)
//
// This is the INTERNATIONAL price of the metal. It is deliberately NOT his
// selling rate: the Indian landed price adds import duty and a local premium,
// and Agra's bhav adds the local market on top of that. Shown as a reference
// so he can see which way the world moved, never as the price he charges.

export const TROY_OUNCE_GRAMS = 31.1034768;

const GOLD_URL = 'https://api.gold-api.com/price/XAU';
const SILVER_URL = 'https://api.gold-api.com/price/XAG';
const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR';

export function perGramPaise(usdPerOunce, inrPerUsd) {
  if (!usdPerOunce || !inrPerUsd) return null;
  const usdPerGram = usdPerOunce / TROY_OUNCE_GRAMS;
  return Math.round(usdPerGram * inrPerUsd * 100);
}

export function trendOf(history, field) {
  if (!history || history.length < 2) return null;
  const sorted = history.slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const first = sorted[0][field];
  const last = sorted[sorted.length - 1][field];
  if (first == null || last == null) return null;
  const diff = last - first;
  return {
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    deltaPaise: Math.abs(diff),
    readings: sorted.length,
    fromAt: sorted[0].at,
    toAt: sorted[sorted.length - 1].at
  };
}

async function getJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  return res.json();
}

// Never blocks the counter: it is called with a timeout and every caller
// treats failure as "no reference available today", not as an error.
export async function fetchMarket({ timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const [gold, silver, fx] = await Promise.all([
      getJson(GOLD_URL, ctrl.signal),
      getJson(SILVER_URL, ctrl.signal),
      getJson(FX_URL, ctrl.signal)
    ]);
    const inrPerUsd = fx && fx.rates ? fx.rates.INR : null;
    return {
      at: new Date().toISOString(),
      goldUsdOz: gold.price,
      silverUsdOz: silver.price,
      inrPerUsd,
      goldPaise: perGramPaise(gold.price, inrPerUsd),
      silverPaise: perGramPaise(silver.price, inrPerUsd),
      sourceUpdatedAt: gold.updatedAt || null
    };
  } finally {
    clearTimeout(timer);
  }
}
