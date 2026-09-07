const CACHE = 'sarafa-v1';
const SHELL = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/config.js', './js/app.js', './js/fmt.js', './js/calc.js',
  './js/ledger.js', './js/db.js', './js/backup.js',
  './js/screens/bhav.js', './js/screens/bill.js',
  './js/screens/udhaar.js', './js/screens/grahak.js',
  './icons/icon-192.png', './icons/icon-512.png',
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

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
