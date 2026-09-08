# सर्राफ

Offline-first Hindi PWA for a jewellery shop in Awagarh.

No build step. Serve the directory and open it:

    python3 -m http.server 8000

Then visit http://localhost:8000

Run tests:

    node --test "test/*.test.js"

## Shipping an update

Edit files and push. The service worker uses stale-while-revalidate: the
first launch after a change fetches it in the background, the next launch
runs it. The app always opens instantly from cache and never waits on the
network.

Bump `CACHE` in `sw.js` only when adding or removing a file in `SHELL`.
