// A thin native shell around the same web app the phone runs in Safari.
//
// Same choice as the Mac app: it loads the live site rather than a bundled
// copy, so a push to GitHub Pages reaches the phone without a rebuild, and
// the ledger lives on the same https origin it would in Safari. WKWebView
// keeps its own IndexedDB and service worker inside the app container, where
// iOS will not evict it the way it eventually evicts a browser tab.
import UIKit
import WebKit

let appURL = URL(string: "https://shivank-codes.github.io/sarafa-app/")!

class ShopViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
  private var web: WKWebView!

  override func loadView() {
    let cfg = WKWebViewConfiguration()
    cfg.websiteDataStore = .default()          // persistent: the book must survive a quit
    cfg.defaultWebpagePreferences.allowsContentJavaScript = true
    cfg.allowsInlineMediaPlayback = true

    web = WKWebView(frame: .zero, configuration: cfg)
    web.navigationDelegate = self
    web.uiDelegate = self
    web.allowsBackForwardNavigationGestures = true
    // The page paints its own background into the safe areas; a bouncing
    // scroll view would show white above and below it.
    web.scrollView.bounces = false
    web.backgroundColor = UIColor(red: 1, green: 0.992, blue: 0.969, alpha: 1)
    web.isOpaque = false
    view = web
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    web.load(URLRequest(url: appURL))
  }

  // The page is light-on-cream at every hour; a light status bar would vanish.
  override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

  // Anything that is not the app itself — a WhatsApp reminder, the credits
  // page — belongs in Safari, not inside the shop screen.
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
               decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = action.request.url,
       let host = url.host,
       host != appURL.host {
      UIApplication.shared.open(url)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }

  // target="_blank" links arrive here with no frame to load into.
  func webView(_ webView: WKWebView, createWebViewWith cfg: WKWebViewConfiguration,
               for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    if let url = action.request.url { UIApplication.shared.open(url) }
    return nil
  }

  // With no network and nothing cached yet, say so in Hindi rather than
  // showing Safari's English error inside an app called सर्राफ.
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
        content="width=device-width,initial-scale=1,viewport-fit=cover"></head>
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

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions:
                     [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let w = UIWindow(frame: UIScreen.main.bounds)
    w.rootViewController = ShopViewController()
    w.makeKeyAndVisible()
    window = w
    return true
  }
}
