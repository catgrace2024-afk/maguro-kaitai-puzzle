/* マグロ部位パズル ─ オフラインで遊べるようにする係 */
var VERSION = "1.0.0";
var CACHE   = "maguro-" + VERSION;
var ASSETS  = [
  "./", "./index.html", "./manifest.webmanifest", "./vendor/three.min.js",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-192-maskable.png", "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;          /* Googleフォントなどはそのまま通す */
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
