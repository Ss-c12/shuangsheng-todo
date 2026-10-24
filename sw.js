/* 双生待办 Service Worker —— 离线缓存 */
const CACHE = "ss-todo-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // 同源：页面导航 network-first（保证更新及时），其余资源 cache-first
  if (url.origin === location.origin) {
    if (e.request.mode === "navigate") {
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
      );
    } else {
      e.respondWith(
        caches.match(e.request).then(
          (r) =>
            r ||
            fetch(e.request).then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
              return res;
            })
        )
      );
    }
    return;
  }

  // 跨域（Google Fonts 等）：cache-first，失败再回退缓存
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => cached)
    )
  );
});
