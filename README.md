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

## Putting it on the iPhone

Two ways, both free.

**Home screen (nothing to install, never expires).** Open
https://shivank-codes.github.io/sarafa-app/ in Safari, tap Share, choose
"Add to Home Screen". The app says this itself on an iPhone.

**A real installed app (`scripts/ios`).** A WKWebView around the same live
site, the iPhone twin of `scripts/mac`. Open `scripts/ios/Sarafa.xcodeproj`,
select the Sarafa target, and under Signing & Capabilities pick a personal
team — a plain Apple ID is enough, no paid membership. Plug the phone in,
choose it as the run destination, press Run. On the phone, trust the
developer once under Settings › General › VPN & Device Management.

A free signature lasts seven days. After that the app refuses to open until
the phone is plugged back into this Mac and Run is pressed again. That is
Apple's limit, not a bug here, and it is the reason the home screen route
stays the one to hand to the shop.

Icons are loose PNGs rather than an asset catalog, because `actool` will not
run on a Mac with no simulator runtime installed.
