# Sarafa Shop PWA — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable, offline-first Hindi PWA that lets a jewellery shop owner in Awagarh set the day's gold/silver rate, write a bill against it, and track udhaar — all with the network off.

**Architecture:** Three layers, strictly separated. **Pure logic** (`js/calc.js`, `js/ledger.js`, `js/fmt.js`) has no DOM and no storage, so it is unit-tested under Node. **Storage** (`js/db.js`) is a thin promise wrapper over IndexedDB and is the only file that touches it. **Screens** (`js/screens/*.js`) render DOM and call the other two. This split exists because IndexedDB and the DOM do not run under `node:test`; keeping the arithmetic pure is what makes the money-handling code testable at all.

**Tech Stack:** Plain ES modules, no framework, no build step, no dependencies. `node:test` (built into Node 18+) as the test runner. Service worker for offline. IndexedDB for storage. GitHub Pages for hosting.

**Spec:** `docs/superpowers/specs/2026-09-07-sarafa-shop-pwa-design.md`

## Global Constraints

- **Zero cost.** No paid accounts, APIs, hosting, or dependencies. No npm runtime dependencies at all.
- **No build step.** Files are served exactly as authored. ES modules only, no bundler, no transpiler.
- **Hindi only.** Every user-visible string is Devanagari. No English in the UI, including placeholders, button labels, and error messages.
- **Offline-first.** Every user action completes against local storage. No code path blocks on the network.
- **Currency:** Indian rupees, `₹` symbol, Indian digit grouping (`₹1,20,500`), Western digits (not Devanagari numerals — shopkeepers read `5` faster than `५`).
- **Weight:** grams, up to 3 decimal places.
- **Shop name:** `संकेत गोयल मुकेश कुमार सर्राफ` — spelling of `सर्राफ` unconfirmed; keep it in exactly one constant (`js/config.js`) so it can be changed in one place.
- **Node 18+** required for `node:test` and the built-in test runner.
- **Rate immutability:** a saved bill stores the rate it used. No later rate change may alter a past bill.

---

### Task 1: Project scaffold and installable PWA shell

**Files:**
- Create: `index.html`, `css/app.css`, `js/config.js`, `js/app.js`, `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`, `.gitignore`, `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: `js/config.js` exporting `export const SHOP_NAME = 'संकेत गोयल मुकेश कुमार सर्राफ';` and `export const APP_VERSION = '1';`. `js/app.js` exporting `export function showTab(name)` where `name` is one of `'bhav' | 'bill' | 'udhaar' | 'grahak'`.

- [ ] **Step 1: Create the directory structure**

```bash
cd ~/dev/sarafa-app
mkdir -p css js/screens icons test fonts
```

- [ ] **Step 2: Write `js/config.js`**

```javascript
export const SHOP_NAME = 'संकेत गोयल मुकेश कुमार सर्राफ';
export const APP_VERSION = '1';
```

- [ ] **Step 3: Write `index.html`**

Four `<section>` panels and a four-button bottom tab bar. Only one panel is visible at a time.

```html
<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#7a5c00">
<title>सर्राफ</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="stylesheet" href="css/app.css">
</head>
<body>
<header id="shop-name"></header>
<main>
  <section id="panel-bhav" class="panel"></section>
  <section id="panel-bill" class="panel" hidden></section>
  <section id="panel-udhaar" class="panel" hidden></section>
  <section id="panel-grahak" class="panel" hidden></section>
</main>
<nav id="tabs">
  <button data-tab="bhav" class="active">भाव</button>
  <button data-tab="bill">बिल</button>
  <button data-tab="udhaar">उधार</button>
  <button data-tab="grahak">ग्राहक</button>
</nav>
<script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write `js/app.js`**

```javascript
import { SHOP_NAME } from './config.js';

const TABS = ['bhav', 'bill', 'udhaar', 'grahak'];

export function showTab(name) {
  for (const t of TABS) {
    document.getElementById('panel-' + t).hidden = (t !== name);
    document.querySelector(`#tabs button[data-tab="${t}"]`)
      .classList.toggle('active', t === name);
  }
}

document.getElementById('shop-name').textContent = SHOP_NAME;
document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) showTab(btn.dataset.tab);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
```

- [ ] **Step 5: Write `css/app.css`**

Large touch targets and high contrast — this is read in shop light, at arm's length.

```css
:root {
  --gold: #7a5c00;
  --bg: #fffdf7;
  --ink: #1a1a1a;
  --line: #e0d8c0;
  --tap: 56px;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: 'Noto Sans Devanagari', system-ui, sans-serif;
  font-size: 18px; padding-bottom: calc(var(--tap) + env(safe-area-inset-bottom));
}
#shop-name {
  background: var(--gold); color: #fff; padding: 14px 16px;
  font-size: 20px; font-weight: 700; text-align: center;
}
main { padding: 16px; }
.panel[hidden] { display: none; }
input, select, button { font: inherit; min-height: var(--tap); }
input, select {
  width: 100%; padding: 12px; margin-bottom: 14px;
  border: 2px solid var(--line); border-radius: 10px; background: #fff;
}
label { display: block; margin-bottom: 6px; font-weight: 600; }
.btn {
  width: 100%; background: var(--gold); color: #fff; border: 0;
  border-radius: 10px; font-weight: 700; margin-bottom: 12px;
}
#tabs {
  position: fixed; bottom: 0; left: 0; right: 0; display: flex;
  background: #fff; border-top: 2px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
#tabs button {
  flex: 1; border: 0; background: none; color: #666; font-size: 17px;
}
#tabs button.active { color: var(--gold); font-weight: 700; }
.total { font-size: 34px; font-weight: 700; color: var(--gold); }
.row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid var(--line);
}
```

- [ ] **Step 6: Write `manifest.webmanifest`**

```json
{
  "name": "संकेत गोयल मुकेश कुमार सर्राफ",
  "short_name": "सर्राफ",
  "lang": "hi",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#fffdf7",
  "theme_color": "#7a5c00",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 7: Write `sw.js`**

Cache-first for the app shell. Bumping `APP_VERSION` in the cache name is what ships an update.

```javascript
const CACHE = 'sarafa-v1';
const SHELL = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/config.js', './js/app.js', './js/fmt.js', './js/calc.js',
  './js/ledger.js', './js/db.js',
  './js/screens/bhav.js', './js/screens/bill.js',
  './js/screens/udhaar.js', './js/screens/grahak.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
```

- [ ] **Step 8: Generate the two icons**

A gold square with `सर्राफ` centred. No design tool needed:

```bash
cd ~/dev/sarafa-app
python3 -c "
from PIL import Image, ImageDraw
for s in (192, 512):
    img = Image.new('RGB', (s, s), '#7a5c00')
    d = ImageDraw.Draw(img)
    d.ellipse([s*0.28, s*0.28, s*0.72, s*0.72], fill='#ffd700')
    img.save(f'icons/icon-{s}.png')
"
```

If Pillow is unavailable, run `pip3 install --user Pillow` first. Real Devanagari text on the icon needs a font file; a plain gold disc is acceptable and can be replaced later.

- [ ] **Step 9: Write `.gitignore` and `README.md`**

```bash
printf 'node_modules/\n.DS_Store\n' > .gitignore
printf '# सर्राफ\n\nOffline-first Hindi PWA for a jewellery shop in Awagarh.\n\nNo build step. Serve the directory and open it:\n\n    python3 -m http.server 8000\n\nThen visit http://localhost:8000\n\nRun tests:\n\n    node --test test/\n' > README.md
```

- [ ] **Step 10: Verify it loads and the tabs switch**

Run: `cd ~/dev/sarafa-app && python3 -m http.server 8000`
Open `http://localhost:8000` and tap each of the four tabs.
Expected: the shop name in the gold header, four tabs, exactly one empty panel visible at a time, the active tab in gold. No console errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: PWA shell with four Hindi tabs and offline service worker"
```

---

### Task 2: Formatting helpers (`fmt.js`)

Money and weight are formatted in dozens of places. Getting this wrong once, centrally, is far better than getting it wrong differently in each screen.

**Files:**
- Create: `js/fmt.js`
- Test: `test/fmt.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export function rupees(paise: number): string` — takes **integer paise**, returns `'₹1,20,500'` style. Whole rupees when paise are zero, otherwise two decimals.
  - `export function grams(g: number): string` — returns `'12.500 ग्राम'`, always 3 decimals.
  - `export function hindiDate(iso: string): string` — takes `'2026-09-07'`, returns `'7 सितंबर 2026'`.

**Money is stored and computed in integer paise throughout the app.** Floating-point rupees produce ₹0.01 errors that a shopkeeper will notice and lose trust over. Only `rupees()` converts to a display string.

- [ ] **Step 1: Write the failing test**

Create `test/fmt.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { rupees, grams, hindiDate } from '../js/fmt.js';

test('rupees groups in the Indian style', () => {
  assert.equal(rupees(12050000), '₹1,20,500');
  assert.equal(rupees(100000), '₹1,000');
  assert.equal(rupees(0), '₹0');
});

test('rupees shows paise only when non-zero', () => {
  assert.equal(rupees(50050), '₹500.50');
  assert.equal(rupees(50000), '₹500');
});

test('grams always shows three decimals', () => {
  assert.equal(grams(12.5), '12.500 ग्राम');
  assert.equal(grams(0), '0.000 ग्राम');
});

test('hindiDate renders the month in Devanagari', () => {
  assert.equal(hindiDate('2026-09-07'), '7 सितंबर 2026');
  assert.equal(hindiDate('2026-01-31'), '31 जनवरी 2026');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/dev/sarafa-app && node --test test/fmt.test.js`
Expected: FAIL — cannot find module `../js/fmt.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `js/fmt.js`:

```javascript
const MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

function group(intStr) {
  // Indian grouping: last three digits, then pairs.
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

export function rupees(paise) {
  const neg = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  let out = '₹' + group(String(whole));
  if (cents !== 0) out += '.' + String(cents).padStart(2, '0');
  return neg ? '-' + out : out;
}

export function grams(g) {
  return g.toFixed(3) + ' ग्राम';
}

export function hindiDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/fmt.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add js/fmt.js test/fmt.test.js
git commit -m "feat: Hindi money, weight and date formatting"
```

---

### Task 3: Bill arithmetic (`calc.js`)

**Files:**
- Create: `js/calc.js`
- Test: `test/calc.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export function lineTotal({ weight, ratePerGram, makingPaise }): number` — `weight` in grams, `ratePerGram` in **paise per gram**, `makingPaise` a flat charge in paise. Returns integer paise, rounded to the nearest paisa.
  - `export function billTotal(lines: Array): number` — sum of `lineTotal` over each line, integer paise.

- [ ] **Step 1: Write the failing test**

Create `test/calc.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { lineTotal, billTotal } from '../js/calc.js';

test('lineTotal multiplies weight by rate and adds making', () => {
  // 10 g at ₹7,000/g = ₹70,000, plus ₹500 making = ₹70,500
  assert.equal(lineTotal({ weight: 10, ratePerGram: 700000, makingPaise: 50000 }), 7050000);
});

test('lineTotal handles fractional weights without float drift', () => {
  // 12.345 g at ₹6,850/g = ₹84,563.25
  assert.equal(lineTotal({ weight: 12.345, ratePerGram: 685000, makingPaise: 0 }), 8456325);
});

test('lineTotal rounds to the nearest paisa', () => {
  // 0.333 g at ₹1.00/g = 33.3 paise -> 33
  assert.equal(lineTotal({ weight: 0.333, ratePerGram: 100, makingPaise: 0 }), 33);
});

test('lineTotal with zero weight is just the making charge', () => {
  assert.equal(lineTotal({ weight: 0, ratePerGram: 700000, makingPaise: 20000 }), 20000);
});

test('billTotal sums every line', () => {
  const lines = [
    { weight: 10, ratePerGram: 700000, makingPaise: 50000 },
    { weight: 5, ratePerGram: 700000, makingPaise: 0 }
  ];
  assert.equal(billTotal(lines), 7050000 + 3500000);
});

test('billTotal of no lines is zero', () => {
  assert.equal(billTotal([]), 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/calc.test.js`
Expected: FAIL — cannot find module `../js/calc.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `js/calc.js`:

```javascript
export function lineTotal({ weight, ratePerGram, makingPaise }) {
  return Math.round(weight * ratePerGram) + Math.round(makingPaise);
}

export function billTotal(lines) {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/calc.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add js/calc.js test/calc.test.js
git commit -m "feat: bill arithmetic in integer paise"
```

---

### Task 4: Udhaar balance (`ledger.js`)

**Files:**
- Create: `js/ledger.js`
- Test: `test/ledger.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export function balance({ bills, payments }): number` — sums the totals of credit bills, subtracts payments, returns integer paise. A bill counts only when `bill.settlement === 'udhaar'`.
  - `export function outstanding(customers, billsByCustomer, paymentsByCustomer): Array` — returns `[{ customer, balancePaise }]` for customers with a non-zero balance, largest balance first.

- [ ] **Step 1: Write the failing test**

Create `test/ledger.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { balance, outstanding } from '../js/ledger.js';

test('balance counts credit bills and subtracts payments', () => {
  const bills = [
    { totalPaise: 500000, settlement: 'udhaar' },
    { totalPaise: 300000, settlement: 'udhaar' }
  ];
  const payments = [{ amountPaise: 200000 }];
  assert.equal(balance({ bills, payments }), 600000);
});

test('balance ignores cash bills', () => {
  const bills = [
    { totalPaise: 500000, settlement: 'nakad' },
    { totalPaise: 100000, settlement: 'udhaar' }
  ];
  assert.equal(balance({ bills, payments: [] }), 100000);
});

test('balance of a fully paid customer is zero', () => {
  const bills = [{ totalPaise: 500000, settlement: 'udhaar' }];
  const payments = [{ amountPaise: 500000 }];
  assert.equal(balance({ bills, payments }), 0);
});

test('balance goes negative when a customer overpays', () => {
  const bills = [{ totalPaise: 100000, settlement: 'udhaar' }];
  const payments = [{ amountPaise: 150000 }];
  assert.equal(balance({ bills, payments }), -50000);
});

test('outstanding ranks by balance and drops the settled', () => {
  const customers = [
    { id: 1, name: 'रामू' },
    { id: 2, name: 'श्याम' },
    { id: 3, name: 'मोहन' }
  ];
  const billsBy = {
    1: [{ totalPaise: 100000, settlement: 'udhaar' }],
    2: [{ totalPaise: 900000, settlement: 'udhaar' }],
    3: [{ totalPaise: 400000, settlement: 'udhaar' }]
  };
  const paymentsBy = { 3: [{ amountPaise: 400000 }] };
  const result = outstanding(customers, billsBy, paymentsBy);
  assert.deepEqual(result.map((r) => r.customer.name), ['श्याम', 'रामू']);
  assert.equal(result[0].balancePaise, 900000);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/ledger.test.js`
Expected: FAIL — cannot find module `../js/ledger.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `js/ledger.js`:

```javascript
export function balance({ bills = [], payments = [] }) {
  const owed = bills
    .filter((b) => b.settlement === 'udhaar')
    .reduce((s, b) => s + b.totalPaise, 0);
  const paid = payments.reduce((s, p) => s + p.amountPaise, 0);
  return owed - paid;
}

export function outstanding(customers, billsByCustomer, paymentsByCustomer) {
  return customers
    .map((customer) => ({
      customer,
      balancePaise: balance({
        bills: billsByCustomer[customer.id] || [],
        payments: paymentsByCustomer[customer.id] || []
      })
    }))
    .filter((r) => r.balancePaise !== 0)
    .sort((a, b) => b.balancePaise - a.balancePaise);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/ledger.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the whole suite**

Run: `node --test test/`
Expected: PASS, 15 tests across three files.

- [ ] **Step 6: Commit**

```bash
git add js/ledger.js test/ledger.test.js
git commit -m "feat: udhaar balance calculation"
```

---

### Task 5: IndexedDB storage layer (`db.js`)

The only file in the app that touches IndexedDB. Screens never open a transaction themselves.

**Files:**
- Create: `js/db.js`

**Interfaces:**
- Consumes: nothing
- Produces (every function returns a Promise):
  - `export async function open(): Promise<IDBDatabase>` — idempotent; later calls reuse the open handle.
  - `export async function put(store: string, value: object): Promise<number>` — insert or update, resolves to the record's key.
  - `export async function all(store: string): Promise<Array>` — every record in a store.
  - `export async function byIndex(store: string, index: string, value: any): Promise<Array>`
  - `export async function get(store: string, key: number): Promise<object|undefined>`

Schema, version 1 — four stores, all with `autoIncrement` keys except `rates`:
  - `rates` — keyPath `date` (the ISO string; one rate row per day, so re-saving overwrites)
  - `bills` — index `byCustomer` on `customerId`, index `byDate` on `date`
  - `customers` — index `byPhone` on `phone`
  - `payments` — index `byCustomer` on `customerId`

- [ ] **Step 1: Write `js/db.js`**

```javascript
const DB_NAME = 'sarafa';
const DB_VERSION = 1;
let dbPromise = null;

export function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('rates')) {
        db.createObjectStore('rates', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('bills')) {
        const s = db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byCustomer', 'customerId');
        s.createIndex('byDate', 'date');
      }
      if (!db.objectStoreNames.contains('customers')) {
        const s = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byPhone', 'phone');
      }
      if (!db.objectStoreNames.contains('payments')) {
        const s = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byCustomer', 'customerId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  const db = await open();
  const tx = db.transaction(store, 'readwrite');
  const result = await wrap(tx.objectStore(store).put(value));
  return result;
}

export async function all(store) {
  const db = await open();
  return wrap(db.transaction(store, 'readonly').objectStore(store).getAll());
}

export async function get(store, key) {
  const db = await open();
  return wrap(db.transaction(store, 'readonly').objectStore(store).get(key));
}

export async function byIndex(store, index, value) {
  const db = await open();
  return wrap(
    db.transaction(store, 'readonly').objectStore(store).index(index).getAll(value)
  );
}
```

- [ ] **Step 2: Verify the schema in the browser**

Run: `python3 -m http.server 8000`, open the app, and in the DevTools console:

```javascript
const db = await import('./js/db.js');
await db.put('customers', { name: 'परीक्षण', phone: '9999999999' });
console.log(await db.all('customers'));
```

Expected: an array with one customer, `id: 1`. Confirm under Application → IndexedDB → `sarafa` that all four stores exist.

- [ ] **Step 3: Clear the test record**

```javascript
indexedDB.deleteDatabase('sarafa');
```

Then reload the page so the schema is recreated clean.

- [ ] **Step 4: Commit**

```bash
git add js/db.js
git commit -m "feat: IndexedDB storage layer with four stores"
```

---

### Task 6: भाव screen — set today's rate

The first action of the day and the one every bill depends on.

**Files:**
- Create: `js/screens/bhav.js`
- Modify: `js/app.js` (import and initialise the screen)

**Interfaces:**
- Consumes: `db.put`, `db.get` from `js/db.js`; `rupees`, `hindiDate` from `js/fmt.js`
- Produces:
  - `export function todayISO(): string` — local date as `'YYYY-MM-DD'`. **Must use local time, not `toISOString()`**, which is UTC and rolls the date over at 5:30 AM IST.
  - `export async function currentRates(): Promise<{sonaPerGram: number, chandiPerGram: number} | null>` — today's rates in paise per gram, or `null` if not yet set.
  - `export async function initBhav(): Promise<void>` — renders the panel.

- [ ] **Step 1: Write `js/screens/bhav.js`**

```javascript
import * as db from '../db.js';
import { rupees, hindiDate } from '../fmt.js';

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function currentRates() {
  const row = await db.get('rates', todayISO());
  return row ? { sonaPerGram: row.sonaPerGram, chandiPerGram: row.chandiPerGram } : null;
}

export async function initBhav() {
  const panel = document.getElementById('panel-bhav');
  const today = todayISO();
  const saved = await currentRates();

  panel.innerHTML = `
    <p>${hindiDate(today)}</p>
    <label for="sona">सोना — भाव प्रति ग्राम</label>
    <input id="sona" type="number" inputmode="decimal" min="0" step="1">
    <label for="chandi">चांदी — भाव प्रति ग्राम</label>
    <input id="chandi" type="number" inputmode="decimal" min="0" step="0.01">
    <button id="save-bhav" class="btn">आज का भाव सुरक्षित करें</button>
    <p id="bhav-status"></p>
  `;

  const sona = panel.querySelector('#sona');
  const chandi = panel.querySelector('#chandi');
  const status = panel.querySelector('#bhav-status');

  if (saved) {
    sona.value = saved.sonaPerGram / 100;
    chandi.value = saved.chandiPerGram / 100;
    status.textContent = `आज का भाव तय है — सोना ${rupees(saved.sonaPerGram)}, चांदी ${rupees(saved.chandiPerGram)}`;
  } else {
    status.textContent = 'आज का भाव अभी तय नहीं हुआ है।';
  }

  panel.querySelector('#save-bhav').addEventListener('click', async () => {
    const s = Math.round(Number(sona.value) * 100);
    const c = Math.round(Number(chandi.value) * 100);
    if (!(s > 0) || !(c > 0)) {
      status.textContent = 'कृपया सोना और चांदी दोनों का भाव भरें।';
      return;
    }
    await db.put('rates', { date: today, sonaPerGram: s, chandiPerGram: c });
    status.textContent = `भाव सुरक्षित — सोना ${rupees(s)}, चांदी ${rupees(c)}`;
  });
}
```

- [ ] **Step 2: Wire it into `js/app.js`**

Add the import at the top and the call at the bottom:

```javascript
import { initBhav } from './screens/bhav.js';
```

```javascript
initBhav();
```

- [ ] **Step 3: Verify in the browser**

Reload, enter `7000` and `85`, tap सुरक्षित करें.
Expected: `भाव सुरक्षित — सोना ₹7,000, चांदी ₹85`. Reload the page: both fields are pre-filled and the status reads `आज का भाव तय है`.

- [ ] **Step 4: Verify it works offline**

In DevTools → Network, tick **Offline**, then reload and save a rate.
Expected: the page loads from the service worker and saving still succeeds.

- [ ] **Step 5: Commit**

```bash
git add js/screens/bhav.js js/app.js
git commit -m "feat: daily gold and silver rate entry"
```

---

### Task 7: बिल screen — write a bill

**Files:**
- Create: `js/screens/bill.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `db.put`, `db.all` from `js/db.js`; `lineTotal` from `js/calc.js`; `rupees` from `js/fmt.js`; `currentRates`, `todayISO` from `js/screens/bhav.js`
- Produces: `export async function initBill(): Promise<void>`

A saved bill record:

```javascript
{
  id,                    // auto
  date: '2026-09-07',
  metal: 'sona' | 'chandi',
  weight: 12.5,          // grams
  ratePerGram: 700000,   // paise — COPIED at save time, never re-read
  makingPaise: 50000,
  totalPaise: 8800000,
  settlement: 'nakad' | 'udhaar',
  customerId: null       // required when settlement is 'udhaar'
}
```

One metal, one weight per bill. Multi-line bills are not needed at this counter and would cost adoption.

- [ ] **Step 1: Write `js/screens/bill.js`**

```javascript
import * as db from '../db.js';
import { lineTotal } from '../calc.js';
import { rupees } from '../fmt.js';
import { currentRates, todayISO } from './bhav.js';

export async function initBill() {
  const panel = document.getElementById('panel-bill');
  const rates = await currentRates();

  if (!rates) {
    panel.innerHTML = '<p>पहले आज का भाव भरें। ऊपर "भाव" पर जाएँ।</p>';
    return;
  }

  const customers = await db.all('customers');

  panel.innerHTML = `
    <label for="metal">धातु</label>
    <select id="metal">
      <option value="sona">सोना</option>
      <option value="chandi">चांदी</option>
    </select>
    <label for="weight">वज़न (ग्राम)</label>
    <input id="weight" type="number" inputmode="decimal" min="0" step="0.001">
    <label for="making">मजदूरी (₹)</label>
    <input id="making" type="number" inputmode="decimal" min="0" step="1" value="0">
    <p>कुल: <span id="bill-total" class="total">₹0</span></p>
    <button id="save-nakad" class="btn">नकद</button>
    <label for="cust">उधार — ग्राहक</label>
    <select id="cust">
      <option value="">— ग्राहक चुनें —</option>
      ${customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
    </select>
    <button id="save-udhaar" class="btn">उधार लिखें</button>
    <p id="bill-status"></p>
  `;

  const metal = panel.querySelector('#metal');
  const weight = panel.querySelector('#weight');
  const making = panel.querySelector('#making');
  const totalEl = panel.querySelector('#bill-total');
  const status = panel.querySelector('#bill-status');

  const rateNow = () =>
    metal.value === 'sona' ? rates.sonaPerGram : rates.chandiPerGram;

  const currentTotal = () => lineTotal({
    weight: Number(weight.value) || 0,
    ratePerGram: rateNow(),
    makingPaise: Math.round((Number(making.value) || 0) * 100)
  });

  const refresh = () => { totalEl.textContent = rupees(currentTotal()); };
  metal.addEventListener('change', refresh);
  weight.addEventListener('input', refresh);
  making.addEventListener('input', refresh);

  async function save(settlement, customerId) {
    const w = Number(weight.value);
    if (!(w > 0)) { status.textContent = 'वज़न भरें।'; return; }
    if (settlement === 'udhaar' && !customerId) {
      status.textContent = 'उधार के लिए ग्राहक चुनें।';
      return;
    }
    await db.put('bills', {
      date: todayISO(),
      metal: metal.value,
      weight: w,
      ratePerGram: rateNow(),
      makingPaise: Math.round((Number(making.value) || 0) * 100),
      totalPaise: currentTotal(),
      settlement,
      customerId: customerId || null
    });
    status.textContent = `बिल सुरक्षित — ${rupees(currentTotal())}`;
    weight.value = '';
    making.value = '0';
    refresh();
  }

  panel.querySelector('#save-nakad')
    .addEventListener('click', () => save('nakad', null));
  panel.querySelector('#save-udhaar')
    .addEventListener('click', () =>
      save('udhaar', Number(panel.querySelector('#cust').value) || null));
}
```

- [ ] **Step 2: Wire it into `js/app.js`**

Import `initBill` and call it inside `showTab` whenever the `bill` tab is selected, so the rate and customer list are re-read each time:

```javascript
import { initBill } from './screens/bill.js';
```

In `showTab`, after the loop:

```javascript
  if (name === 'bill') initBill();
```

- [ ] **Step 3: Verify the total updates live**

Set a rate of `7000` for sona. Go to बिल, enter weight `10`, making `500`.
Expected: the total reads `₹70,500` and updates on every keystroke.

- [ ] **Step 4: Verify rate immutability**

Save a नकद bill at `7000`. Go to भाव, change sona to `8000`, save. Return to बिल.
Expected: the new bill's total uses `8000`, but in DevTools the previously saved bill still shows `ratePerGram: 700000`.

- [ ] **Step 5: Commit**

```bash
git add js/screens/bill.js js/app.js
git commit -m "feat: billing screen with live total and cash or credit settlement"
```

---

### Task 8: ग्राहक screen — customers

Built before उधार because उधार cannot be demonstrated without customers to owe money.

**Files:**
- Create: `js/screens/grahak.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `db.put`, `db.all`, `db.byIndex`; `balance` from `js/ledger.js`; `rupees` from `js/fmt.js`
- Produces:
  - `export async function customerBalance(customerId: number): Promise<number>` — integer paise
  - `export async function initGrahak(): Promise<void>`

- [ ] **Step 1: Write `js/screens/grahak.js`**

```javascript
import * as db from '../db.js';
import { balance } from '../ledger.js';
import { rupees } from '../fmt.js';

export async function customerBalance(customerId) {
  const [bills, payments] = await Promise.all([
    db.byIndex('bills', 'byCustomer', customerId),
    db.byIndex('payments', 'byCustomer', customerId)
  ]);
  return balance({ bills, payments });
}

export async function initGrahak() {
  const panel = document.getElementById('panel-grahak');
  const customers = await db.all('customers');
  const balances = await Promise.all(customers.map((c) => customerBalance(c.id)));

  panel.innerHTML = `
    <label for="new-name">नया ग्राहक — नाम</label>
    <input id="new-name" type="text">
    <label for="new-phone">मोबाइल नंबर</label>
    <input id="new-phone" type="tel" inputmode="numeric">
    <button id="add-cust" class="btn">ग्राहक जोड़ें</button>
    <p id="cust-status"></p>
    <h3>सभी ग्राहक</h3>
    ${customers.length === 0 ? '<p>अभी कोई ग्राहक नहीं है।</p>' :
      customers.map((c, i) => `
        <div class="row">
          <span>${c.name}<br><small>${c.phone || ''}</small></span>
          <strong>${rupees(balances[i])}</strong>
        </div>`).join('')}
  `;

  panel.querySelector('#add-cust').addEventListener('click', async () => {
    const name = panel.querySelector('#new-name').value.trim();
    const phone = panel.querySelector('#new-phone').value.trim();
    const status = panel.querySelector('#cust-status');
    if (!name) { status.textContent = 'ग्राहक का नाम भरें।'; return; }
    await db.put('customers', { name, phone });
    await initGrahak();
  });
}
```

- [ ] **Step 2: Wire it into `js/app.js`**

```javascript
import { initGrahak } from './screens/grahak.js';
```

In `showTab`:

```javascript
  if (name === 'grahak') initGrahak();
```

- [ ] **Step 3: Verify**

Add two customers. Go to बिल — both appear in the ग्राहक dropdown. Write an उधार bill of ₹5,000 against the first. Return to ग्राहक.
Expected: the first customer shows `₹5,000`, the second `₹0`.

- [ ] **Step 4: Commit**

```bash
git add js/screens/grahak.js js/app.js
git commit -m "feat: customer register with running balances"
```

---

### Task 9: उधार screen — who owes money, and reminders

**Files:**
- Create: `js/screens/udhaar.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `db.all`, `db.byIndex`, `db.put`; `outstanding` from `js/ledger.js`; `rupees` from `js/fmt.js`; `SHOP_NAME` from `js/config.js`
- Produces:
  - `export function reminderLink(customer, balancePaise): string` — a `https://wa.me/...` URL with a pre-filled Hindi message. **Opens WhatsApp with the message ready; it never sends anything.**
  - `export async function initUdhaar(): Promise<void>`

Phone numbers are stored as the user typed them. `reminderLink` prefixes `91` when the number is exactly 10 digits.

- [ ] **Step 1: Write `js/screens/udhaar.js`**

```javascript
import * as db from '../db.js';
import { outstanding } from '../ledger.js';
import { rupees } from '../fmt.js';
import { SHOP_NAME } from '../config.js';

export function reminderLink(customer, balancePaise) {
  const digits = String(customer.phone || '').replace(/\D/g, '');
  const number = digits.length === 10 ? '91' + digits : digits;
  const msg =
    `नमस्ते ${customer.name} जी, ${SHOP_NAME} की ओर से याद दिलाना है — ` +
    `आपका बकाया ${rupees(balancePaise)} है। धन्यवाद।`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

export async function initUdhaar() {
  const panel = document.getElementById('panel-udhaar');
  const customers = await db.all('customers');

  const billsBy = {};
  const paymentsBy = {};
  await Promise.all(customers.map(async (c) => {
    billsBy[c.id] = await db.byIndex('bills', 'byCustomer', c.id);
    paymentsBy[c.id] = await db.byIndex('payments', 'byCustomer', c.id);
  }));

  const rows = outstanding(customers, billsBy, paymentsBy);
  const totalDue = rows.reduce((s, r) => s + r.balancePaise, 0);

  panel.innerHTML = `
    <p>कुल बकाया: <span class="total">${rupees(totalDue)}</span></p>
    ${rows.length === 0 ? '<p>किसी का उधार बाकी नहीं है।</p>' :
      rows.map((r) => `
        <div class="row">
          <span>${r.customer.name}</span>
          <strong>${rupees(r.balancePaise)}</strong>
        </div>
        <button class="btn pay" data-id="${r.customer.id}">भुगतान दर्ज करें</button>
        ${r.customer.phone ? `<a class="btn" href="${reminderLink(r.customer, r.balancePaise)}"
            target="_blank" rel="noopener"
            style="display:block;text-align:center;line-height:56px;text-decoration:none">
            WhatsApp पर याद दिलाएं</a>` : ''}
      `).join('')}
  `;

  panel.querySelectorAll('.pay').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const input = prompt('कितना भुगतान मिला? (₹)');
      const amount = Math.round(Number(input) * 100);
      if (!(amount > 0)) return;
      await db.put('payments', {
        customerId: Number(btn.dataset.id),
        amountPaise: amount,
        date: new Date().toISOString().slice(0, 10)
      });
      await initUdhaar();
    });
  });
}
```

- [ ] **Step 2: Wire it into `js/app.js`**

```javascript
import { initUdhaar } from './screens/udhaar.js';
```

In `showTab`:

```javascript
  if (name === 'udhaar') initUdhaar();
```

- [ ] **Step 3: Verify the full loop**

With a customer owing ₹5,000: open उधार.
Expected: `कुल बकाया: ₹5,000` and that customer listed. Tap भुगतान दर्ज करें, enter `2000`.
Expected: the balance drops to `₹3,000`. Record `3000` more.
Expected: the customer disappears and the screen reads `किसी का उधार बाकी नहीं है।`

- [ ] **Step 4: Verify the WhatsApp reminder**

Tap `WhatsApp पर याद दिलाएं` for a customer with a phone number.
Expected: WhatsApp (or web.whatsapp.com) opens with the Hindi message pre-filled and **unsent**.

- [ ] **Step 5: Commit**

```bash
git add js/screens/udhaar.js js/app.js
git commit -m "feat: udhaar screen with payments and WhatsApp reminders"
```

---

### Task 10: Backup export

Until Phase 1.5 adds cloud backup, this is the only thing standing between a dropped phone and a lost khata. It is not optional.

**Files:**
- Create: `js/backup.js`
- Modify: `js/screens/grahak.js` (add the button), `sw.js` (add `./js/backup.js` to `SHELL`)

**Interfaces:**
- Consumes: `db.all`
- Produces:
  - `export async function exportAll(): Promise<object>` — `{ version, exportedAt, rates, bills, customers, payments }`
  - `export async function shareBackup(): Promise<void>` — uses the Web Share API where available, otherwise downloads a `.json` file

- [ ] **Step 1: Write `js/backup.js`**

```javascript
import * as db from './db.js';
import { APP_VERSION } from './config.js';

export async function exportAll() {
  const [rates, bills, customers, payments] = await Promise.all([
    db.all('rates'), db.all('bills'), db.all('customers'), db.all('payments')
  ]);
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    rates, bills, customers, payments
  };
}

export async function shareBackup() {
  const data = await exportAll();
  const json = JSON.stringify(data, null, 2);
  const name = `sarafa-backup-${data.exportedAt.slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'सर्राफ बैकअप' });
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Add the button to `js/screens/grahak.js`**

Add the import:

```javascript
import { shareBackup } from '../backup.js';
```

Append to the panel's `innerHTML`:

```javascript
    <button id="backup" class="btn">बैकअप फ़ाइल भेजें</button>
```

And wire it after the `add-cust` listener:

```javascript
  panel.querySelector('#backup').addEventListener('click', shareBackup);
```

- [ ] **Step 3: Add `./js/backup.js` to the `SHELL` array in `sw.js`**

- [ ] **Step 4: Verify**

With rates, a customer, a bill, and a payment recorded, tap बैकअप फ़ाइल भेजें.
Expected on a phone: the WhatsApp/share sheet opens with a `.json` attached. Expected on desktop: a `.json` downloads. Open it — all four arrays are populated.

- [ ] **Step 5: Commit**

```bash
git add js/backup.js js/screens/grahak.js sw.js
git commit -m "feat: export the full ledger as a backup file"
```

---

### Task 11: Bundle the Devanagari font

Deferred to here deliberately: everything above works with the system font, and the font is a large binary that would otherwise slow every earlier commit.

**Files:**
- Create: `fonts/NotoSansDevanagari-Regular.woff2`, `fonts/NotoSansDevanagari-Bold.woff2`
- Modify: `css/app.css`, `sw.js`

**Interfaces:**
- Consumes: nothing
- Produces: nothing importable — a rendering guarantee only

- [ ] **Step 1: Download the two weights**

```bash
cd ~/dev/sarafa-app/fonts
curl -L -o NotoSansDevanagari-Regular.woff2 \
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-400-normal.woff2"
curl -L -o NotoSansDevanagari-Bold.woff2 \
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-devanagari@latest/devanagari-700-normal.woff2"
ls -la
```

Expected: two files, each roughly 40–120 KB. If either is under 5 KB the download failed — check the URL before continuing.

- [ ] **Step 2: Add the `@font-face` rules at the top of `css/app.css`**

```css
@font-face {
  font-family: 'Noto Sans Devanagari';
  src: url('../fonts/NotoSansDevanagari-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Sans Devanagari';
  src: url('../fonts/NotoSansDevanagari-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

- [ ] **Step 3: Add both font files to the `SHELL` array in `sw.js`**

```javascript
  './fonts/NotoSansDevanagari-Regular.woff2',
  './fonts/NotoSansDevanagari-Bold.woff2',
```

- [ ] **Step 4: Verify the font is actually applied**

Reload with DevTools → Network open.
Expected: both `.woff2` files load. In Elements, select the header and confirm the computed `font-family` resolves to `Noto Sans Devanagari`.

- [ ] **Step 5: Commit**

```bash
git add fonts/ css/app.css sw.js
git commit -m "feat: bundle Noto Sans Devanagari for offline text rendering"
```

---

### Task 12: Deploy to GitHub Pages and install on the phone

**Files:**
- Modify: none (repository settings and a push)

**Interfaces:**
- Consumes: everything above
- Produces: a live HTTPS URL

- [ ] **Step 1: Run the full test suite one final time**

Run: `cd ~/dev/sarafa-app && node --test test/`
Expected: PASS, 15 tests, 0 failures. **Do not deploy on a failure.**

- [ ] **Step 2: Create the GitHub repository and push**

```bash
cd ~/dev/sarafa-app
gh repo create sarafa-app --private --source=. --remote=origin --push
```

Private is deliberate — the repository holds a real shop's business logic.

- [ ] **Step 3: Enable Pages**

```bash
gh api -X POST repos/:owner/sarafa-app/pages \
  -f "source[branch]=main" -f "source[path]=/" 2>/dev/null || \
  echo "Enable manually: Settings > Pages > Deploy from branch > main > / (root)"
```

**Note:** GitHub Pages on a private repository requires a paid plan. If this fails on the free tier, make the repo public (`gh repo edit --visibility public`) or deploy the folder to Netlify Drop or Cloudflare Pages instead — both free with HTTPS. The zero-cost constraint takes priority over privacy here.

- [ ] **Step 4: Verify the live site**

Open `https://<username>.github.io/sarafa-app/` on a desktop browser.
Expected: the app loads over HTTPS with no console errors, and DevTools → Application → Service Workers shows it activated.

- [ ] **Step 5: Install it on the phone**

On the phone, open the URL.
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** menu → Install app / Add to Home Screen

Expected: an icon on the home screen. Launching it shows no browser address bar. Turn on aeroplane mode and launch again — the app opens and a bill can still be written.

- [ ] **Step 6: Verify the day-one flow end to end, offline**

With the network off: set the day's भाव, add a ग्राहक, write one नकद bill and one उधार bill, record a partial payment, and export a backup.
Expected: every step completes with no spinner, no error, and no perceptible lag.

- [ ] **Step 7: Commit any fixes and push**

```bash
git add -A && git commit -m "fix: issues found in on-device verification" && git push
```

Skip this step if nothing needed fixing.

---

## Out of scope for Phase 1

Confirmed with the shop owner's brother and deliberately excluded — do not add these:

- Staff logins or multi-user access
- A live gold/silver rate API
- Thermal printer support
- Cloud sync (Phase 1.5)
- Stock register (Phase 2)
- Girvi / pledge records (Phase 3 — requires its own design conversation)
- Vigyapan / promotional messaging (Phase 4)

## Known follow-ups

- Confirm the spelling `सर्राफ` vs `सराफ` before bills are shared with customers. It lives in `js/config.js`.
- `prompt()` in Task 9 is a stopgap for recording a payment. It works and is not glitchy, but a proper inline field would be better; revisit if the owner complains.
- No bill history screen in Phase 1. Bills are stored and exported, but only reachable through the udhaar balances. Add one if he asks "what did I sell today".
