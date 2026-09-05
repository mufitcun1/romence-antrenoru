/* ============================= SERVICE WORKER =============================
   Amaç: uygulamayı "Ana ekrana ekle" ile yüklenebilir/çevrimdışı çalışır hale
   getirmek. Strateji bilinçli olarak şöyle seçildi: HTML/CSS/JS gibi uygulama
   kodu için "önce ağ" (network-first) — yani telefon internetteyken her zaman
   en güncel sürüm gösterilir (geliştirici siteyi güncelledikçe kullanıcı da
   bir sonraki açılışta günceli görür), çevrimdışıyken son başarılı sürüm
   önbellekten gösterilir. Ses dosyaları ve ikonlar gibi nadiren değişen
   varlıklar için ise "önce önbellek" (cache-first) kullanılıyor — hem daha
   hızlı hem veri tasarruflu.

   SHELL_CACHE ismindeki sürüm numarasını her önemli yayında bir artırmak,
   eski istemcilerdeki bozuk/parçalı önbelleği tamamen temizler. */

const SHELL_CACHE = "romence-shell-v6";
const AUDIO_CACHE = "romence-audio-v1";

const SHELL_FILES = [
  "./",
  "index.html",
  "gizlilik-politikasi.html",
  "ads.txt",
  "manifest.json",
  "css/styles.css",
  "js/data.js",
  "js/sentence-gen.js",
  "js/helpers.js",
  "js/state.js",
  "js/storage.js",
  "js/accounts.js",
  "js/gamify.js",
  "js/sync.js",
  "js/feedback.js",
  "js/audio.js",
  "js/icons.js",
  "js/exercises.js",
  "js/ui.js",
  "assets/images/favicon.svg",
  "assets/images/icon-192.png",
  "assets/images/icon-512.png",
  "assets/images/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== SHELL_CACHE && n !== AUDIO_CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

function isAudioRequest(url) {
  return url.pathname.includes("/assets/audio/") && url.pathname.endsWith(".mp3");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAudioRequest(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Uygulama kabuğu (HTML/CSS/JS/manifest/ikonlar): önce ağ, olmazsa önbellek.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await cache.match("index.html");
          if (fallback) return fallback;
        }
        return Response.error();
      }
    })()
  );
});
