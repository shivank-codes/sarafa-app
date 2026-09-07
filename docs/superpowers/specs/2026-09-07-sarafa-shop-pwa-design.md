# Sarafa Shop PWA — Design

**Date:** 2026-09-07
**Shop:** संकेत गोयल मुकेश कुमार सर्राफ, Awagarh (UP)
**User:** one shopkeeper, one phone
**Status:** approved through Phase 1 scope and architecture; girvi (Phase 3) not yet designed

## Problem

A rural jewellery shop is run on a paper bahi-khata. The owner cannot
quickly answer: who owes me money, what did I sell today, what was the
bhav when I made that bill. Paper is also a single point of loss.

## Constraints

These are hard and drive every decision below.

- **Zero cost.** No Apple Developer account, no paid API, no paid
  hosting. This rules out a native iOS app: a free-provisioned build
  expires after 7 days and requires the phone to be physically
  connected to a Mac to re-sign.
- **Hindi only.** All UI text in Devanagari. No English fallback.
- **Unreliable network.** Awagarh connectivity cannot be assumed. The
  app must be fully usable with the network off.
- **No perceptible lag.** The owner is standing at a counter with a
  customer in front of him. Every interaction is a local write; the UI
  never waits on a network round-trip.
- **Phone OS unknown.** It has not been confirmed whether the owner's
  phone is an iPhone or Android. The chosen approach makes this moot.

## Approach

A **Progressive Web App**: a web app installed to the home screen. It
gets an icon, launches full-screen without browser chrome, and runs
offline via a service worker. Free to host and distribute, updates
push instantly, nothing expires, and it runs on either phone OS.

Rejected: native iOS with free provisioning (7-day expiry, needs the
device in hand weekly — unworkable at 300 km); native iOS paid
(violates the zero-cost constraint).

## Phasing

Sequenced by interaction frequency, so the app earns daily habit
before it grows features.

1. **Phase 1 — the counter.** Daily rates, billing/POS, udhaar.
2. **Phase 1.5 — backup.** Free cloud backup of the local database.
3. **Phase 2 — stock.** Item register: weight, purity, cost, photos.
4. **Phase 3 — girvi.** Pledge records. Legally sensitive; requires
   its own design conversation before any work starts.
5. **Phase 4 — vigyapan.** Festival/offer messages over WhatsApp,
   built on the customer list Phase 1 produces.

## Phase 1 design

### Screens

One bottom tab bar, four tabs, nothing nested deeper than two taps.

- **भाव** — enter today's gold and silver rate. First action of the
  day; the habit that opens the app. Every bill depends on it.
- **बिल** — pick सोना/चांदी, enter weight, app applies today's rate
  plus making charges, shows the total in large numerals. Settle as
  **नकद** (paid) or **उधार** (posts to a customer's khata).
- **उधार** — outstanding balances, newest first. Record a payment.
  "WhatsApp पर याद दिलाएं" opens WhatsApp with a pre-written Hindi
  reminder; the app never sends anything by itself.
- **ग्राहक** — customer list, running balance, bill and payment history.

Udhaar is the settlement side of billing, not a separate ledger to
keep in sync.

### Data

IndexedDB, four stores:

- `rates` — date, sona rate, chandi rate
- `bills` — items, weight, **rate used**, making charges, total,
  settlement (नकद/उधार), customer ref
- `customers` — name, phone, running balance
- `payments` — customer ref, amount, date

A bill stores the rate it was written at. Changing today's bhav must
never alter a past bill.

### Technical

- Plain HTML/CSS/JS. No framework, no build step — fast on weak 3G and
  still buildable in five years.
- Noto Sans Devanagari bundled locally, so text renders identically on
  every device and offline.
- Service worker caches the whole app shell on first visit.
- Hosted on GitHub Pages (free, HTTPS — a PWA requires HTTPS).

### Deliberately excluded

- **No staff logins or multi-user.** One shop, one man. A login screen
  every morning is friction with no payoff.
- **No live rate API.** They cost money, the network is unreliable,
  and he knows the day's bhav better than any feed. He types it once
  each morning.
- **No thermal printer support.** A PWA cannot drive one reliably.
  Bills are shared as an image or PDF over WhatsApp instead.
- **No cloud sync in Phase 1.** Until Phase 1.5, a "बैकअप फ़ाइल भेजें"
  button exports the full ledger to WhatsApp or Drive.

## Success criteria

- The owner can produce a bill, with today's rate applied, in under 15
  seconds with the network off.
- He can answer "who owes me money" in one tap.
- Losing the phone does not lose the khata.
- He is still using it, unprompted, after one month.

## Open questions

- Devanagari spelling of the shop name — सर्राफ vs सराफ — to be
  confirmed before it goes on bills.
- Girvi (Phase 3): is the owner a licensed pawnbroker under UP law,
  and should the app **compute** interest and maturity, or only
  **store** pledge details and photos? Blocks Phase 3 only.
