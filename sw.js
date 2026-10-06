const CACHE = "tanach-yomi-v3";
const CORE = ["./", "index.html", "data.js", "font.ttf", "font-ui.ttf", "logo.png", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const COMM = Array.from({ length: 34 }, (_, i) => "comm/" + i + ".json");
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    await Promise.allSettled(COMM.map(u => c.add(u)));   // פירושים - בכל כשל ממשיכים
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || /\/(index\.html|manifest\.webmanifest)?$/.test(new URL(req.url).pathname);
  if (isPage) {   // דף ראשי: קודם רשת (כדי שעדכונים יגיעו), ובלי חיבור - מהמטמון
    e.respondWith(fetch(req).then(n => { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); return n; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if (n.ok) { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return n; })));
});
