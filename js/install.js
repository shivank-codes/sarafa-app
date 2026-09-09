// iOS has no install prompt: the app can only reach the home screen through
// Safari's share sheet, and nothing on the page can trigger it. A shopkeeper
// has no reason to know that gesture, so the app has to say it out loud —
// otherwise it stays a browser tab, loses the persistent-storage grant that
// protects the ledger, and the tab eventually gets closed.
export function isIos() {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  return /iPad|iPhone|iPod/.test(ua) ||
         (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// A link tapped in WhatsApp opens inside WhatsApp, not Safari, and that
// browser has no "Add to Home Screen" anywhere in it. Telling someone there
// to press Safari's share button sends them looking for a button that does
// not exist, and the app stays a tab that gets thrown away with the ledger
// in it.
//
// Best effort only: on iOS these wrappers sometimes present a Safari-based
// browser whose user agent is Safari's, indistinguishable from the real
// thing. The Safari message therefore has to survive being shown here, which
// is why it ends with a line about opening in Safari.
const IN_APP = /WhatsApp|FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|MicroMessenger/;

export function isInAppBrowser() {
  return IN_APP.test(navigator.userAgent);
}

export function isInstalled() {
  return navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
}

const DISMISSED = 'sarafa:install-hint-dismissed';

export function shouldOfferInstall() {
  if (!isIos() || isInstalled()) return false;
  try {
    return localStorage.getItem(DISMISSED) !== '1';
  } catch {
    return true;  // storage blocked: showing the hint again is the safe error
  }
}

export function dismissInstallHint() {
  try { localStorage.setItem(DISMISSED, '1'); } catch { /* nothing to do */ }
}

export function installHintHtml() {
  return isInAppBrowser() ? safariFirstHtml() : addToHomeScreenHtml();
}

// Inside WhatsApp and its like: one instruction only, because nothing else
// can be done from here.
function safariFirstHtml() {
  return `
    <p><strong>पहले Safari में खोलें</strong></p>
    <p>ऊपर या नीचे कोने में <strong>•••</strong> दबाकर
       <strong>“Open in Safari”</strong> चुनें। उसके बाद यह ऐप फ़ोन में
       लग जाएगा।</p>
    <button id="install-dismiss" class="btn ghost">ठीक है</button>`;
}

function addToHomeScreenHtml() {
  return `
    <p><strong>इस ऐप को फ़ोन में लगाएं</strong></p>
    <p>नीचे Safari में <svg class="ios-share" viewBox="0 0 24 24" width="18" height="18"
         aria-label="शेयर" role="img"><g fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/>
         <path d="M6 12H5v8h14v-8h-1"/></g></svg> शेयर का बटन दबाएं, फिर
       <strong>“Add to Home Screen”</strong> चुनें। फिर यह ऐप की तरह खुलेगा,
       बिना इंटरनेट भी चलेगा, और हिसाब फ़ोन में सुरक्षित रहेगा।</p>
    <p class="small">नीचे शेयर का बटन न दिखे तो यह पन्ना पहले Safari में
       खोलें।</p>
    <button id="install-dismiss" class="btn ghost">ठीक है</button>`;
}
