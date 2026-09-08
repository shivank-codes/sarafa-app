import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// The module reads navigator, window and localStorage at call time, so a
// small stand-in is enough to test the decision without a browser.
function setup({ ua, standalone = false, displayMode = false,
                 dismissed = null, storageThrows = false, touchPoints = 0 }) {
  // Node defines navigator as a getter-only global, so plain assignment fails.
  const define = (name, value) =>
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  define('navigator', { userAgent: ua, standalone, maxTouchPoints: touchPoints });
  define('window', { matchMedia: () => ({ matches: displayMode }) });
  define('localStorage', {
    getItem() { if (storageThrows) throw new Error('blocked'); return dismissed; },
    setItem() { if (storageThrows) throw new Error('blocked'); }
  });
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari';
const ANDROID = 'Mozilla/5.0 (Linux; Android 13) Chrome';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari';

let mod;
beforeEach(async () => { mod = await import('../js/install.js'); });

test('an iPhone in Safari is offered the install steps', () => {
  setup({ ua: IPHONE });
  assert.equal(mod.shouldOfferInstall(), true);
});

test('the same iPhone is left alone once the app is on the home screen', () => {
  setup({ ua: IPHONE, standalone: true });
  assert.equal(mod.shouldOfferInstall(), false);
});

test('iPadOS reporting itself as a Mac is still recognised', () => {
  setup({ ua: IPAD, touchPoints: 5 });
  assert.equal(mod.isIos(), true);
  setup({ ua: IPAD, touchPoints: 0 });
  assert.equal(mod.isIos(), false, 'a real Mac must not be told to install');
});

test('Android is never shown iOS share-sheet instructions', () => {
  setup({ ua: ANDROID });
  assert.equal(mod.shouldOfferInstall(), false);
});

test('the hint stays dismissed', () => {
  setup({ ua: IPHONE, dismissed: '1' });
  assert.equal(mod.shouldOfferInstall(), false);
});

test('blocked storage shows the hint rather than swallowing it', () => {
  setup({ ua: IPHONE, storageThrows: true });
  assert.equal(mod.shouldOfferInstall(), true);
  assert.doesNotThrow(() => mod.dismissInstallHint());
});

test('the hint names the gesture a shopkeeper has to find', () => {
  const html = mod.installHintHtml();
  assert.match(html, /Add to Home Screen/);
  assert.match(html, /शेयर/);
});
