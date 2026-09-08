const CACHE = 'sarafa-v17';
const SHELL = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/config.js', './js/app.js', './js/fmt.js', './js/calc.js', './js/pricing.js', './js/market.js',
  './js/screens/market-panel.js',
  './js/ledger.js', './js/day.js', './js/hindi.js', './js/db.js', './js/backup.js', './js/backup-validate.js',
  './js/screens/bhav.js', './js/screens/bill.js',
  './js/screens/udhaar.js', './js/screens/grahak.js', './js/screens/design.js',
  './js/catalog.js', './js/photo.js', './js/samples.js', './js/demo.js', './js/villages.js',
  './js/girvi.js', './js/screens/girvi.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './img/sherowali.svg',
  './js/sketch.js',
  './img/designs/chain.svg', './img/designs/haar.svg', './img/designs/jhumka.svg',
  './img/designs/nath.svg', './img/designs/ring.svg', './img/designs/bangle.svg',
  './img/designs/payal.svg', './img/designs/coin.svg', './img/designs/tika.svg',
  './img/designs/rakhi.svg',
  './img/designs/photos/chain.jpg', './img/designs/photos/haar.jpg',
  './img/designs/photos/jhumka.jpg', './img/designs/photos/nath.jpg',
  './img/designs/photos/ring.jpg', './img/designs/photos/bangle.jpg',
  './img/designs/photos/payal.jpg',
  './fonts/NotoSansDevanagari-Regular.woff2',
  './fonts/NotoSansDevanagari-Bold.woff2'
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

// Stale-while-revalidate: answer instantly from cache so the counter never
// waits on the network, then quietly refresh the cache for the next launch.
// Without the revalidate half, editing any file other than sw.js would never
// reach the phone.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })
  );
});
