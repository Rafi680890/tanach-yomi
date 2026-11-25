const CACHE = "tanach-yomi-v33";
const CORE = ["./", "index.html", "meta.js", "nk.js", "app.js", "font-tx5.woff2", "font-ui.woff2", "font-nk5-s.woff2", "font-nk5-d.woff2", "font-nk5-sd.woff2", "font-nk5-q.woff2", "font-nk5-dq.woff2", "logo.png", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const COMM = Array.from({ length: 34 }, (_, i) => ["text/" + i + ".json", "comm/" + i + ".json"]).flat();
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" }))));   // בלי מטמון הדפדפן (GitHub Pages שומר 10 דקות), אחרת ייתפס קובץ ישן
    await Promise.allSettled(COMM.map(u => c.add(u)));   // פירושים - בכל כשל ממשיכים
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || /\/(index\.html|meta\.js|nk\.js|app\.js|manifest\.webmanifest)?$/.test(new URL(req.url).pathname);
  if (isPage) {   // דף ראשי: קודם רשת (כדי שעדכונים יגיעו), ובלי חיבור - מהמטמון
    e.respondWith(fetch(req, { cache: "no-cache" }).then(n => { if (n.ok) { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return n; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if (n.ok) { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return n; })));
});
