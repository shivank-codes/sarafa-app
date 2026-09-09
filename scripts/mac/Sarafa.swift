// A thin native shell around the same web app the phone runs.
//
// Deliberately not a copy of the app: it loads the live site, so a push to
// GitHub Pages reaches the Mac without rebuilding anything. WKWebView keeps
// its own IndexedDB and service worker, so the ledger persists and the app
// works with no network once it has been opened once.
import Cocoa
import WebKit

let appURL = URL(string: "https://shivank-codes.github.io/sarafa-app/")!

class Window: NSWindow, WKNavigationDelegate, WKUIDelegate {
  let web: WKWebView

  init() {
    let cfg = WKWebViewConfiguration()
    cfg.websiteDataStore = .default()          // persistent: the book must survive a quit
    cfg.defaultWebpagePreferences.allowsContentJavaScript = true
    web = WKWebView(frame: .zero, configuration: cfg)

    super.init(contentRect: NSRect(x: 0, y: 0, width: 480, height: 860),
               styleMask: [.titled, .closable, .miniaturizable, .resizable],
               backing: .buffered, defer: false)

    title = "सर्राफ"
    minSize = NSSize(width: 360, height: 560)
    contentView = web
    center()
    setFrameAutosaveName("SarafaMain")

    web.navigationDelegate = self
    web.uiDelegate = self
    web.allowsBackForwardNavigationGestures = true
    web.load(URLRequest(url: appURL))
  }

  // Anything that is not the app itself — a WhatsApp reminder, the credits
  // page — belongs in the real browser, not inside the shop window.
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
               decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = action.request.url,
       let host = url.host,
       host != appURL.host {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }

  // target="_blank" links arrive here with no frame to load into.
  func webView(_ webView: WKWebView, createWebViewWith cfg: WKWebViewConfiguration,
               for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    if let url = action.request.url { NSWorkspace.shared.open(url) }
    return nil
  }

  // With no network and nothing cached yet, say so in Hindi rather than
  // showing Safari's English error inside a window titled सर्राफ.
  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    showOffline()
  }
  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
               withError error: Error) {
    showOffline()
  }
  private func showOffline() {
    web.loadHTMLString("""
      <html><head><meta charset="utf-8"><meta name="viewport"
        content="width=device-width,initial-scale=1"></head>
      <body style="font:18px -apple-system,sans-serif;background:#fffdf7;color:#1a1a1a;
                   display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;padding:24px">
          <p style="font-weight:700">इंटरनेट नहीं है</p>
          <p>एक बार इंटरनेट से खोलिए, उसके बाद यह बिना इंटरनेट भी चलेगा।</p>
        </div>
      </body></html>
      """, baseURL: nil)
  }
}

class Delegate: NSObject, NSApplicationDelegate {
  var window: Window?
  func applicationDidFinishLaunching(_ note: Notification) {
    window = Window()
    window?.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
  }
  func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = Delegate()
app.delegate = delegate

// A minimal menu so ⌘Q, ⌘W and copy/paste behave like any Mac app.
let menu = NSMenu()
let appItem = NSMenuItem()
menu.addItem(appItem)
let appMenu = NSMenu()
appMenu.addItem(withTitle: "सर्राफ छिपाएं", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
appMenu.addItem(NSMenuItem.separator())
appMenu.addItem(withTitle: "बंद करें", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
appItem.submenu = appMenu

let editItem = NSMenuItem()
menu.addItem(editItem)
let editMenu = NSMenu(title: "Edit")
editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
editItem.submenu = editMenu

app.mainMenu = menu
app.run()
