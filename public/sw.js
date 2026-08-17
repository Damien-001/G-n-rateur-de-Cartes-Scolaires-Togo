const CACHE_VERSION = 'v2';
const SHELL_CACHE = `cartes-togo-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cartes-togo-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `cartes-togo-fonts-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Installation : mise en cache immédiate de l'app shell et activation rapide
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activation : suppression des anciens caches et prise de contrôle immédiate
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, RUNTIME_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🧹 Suppression de l\'ancien cache SW:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les extensions Chrome
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // 1. Navigation HTML (Ouverture de la page) : Network-First avec fallback immédiat sur index.html en cache
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          console.log('⚡ Mode hors-ligne détecté, chargement depuis le cache local');
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Polices Google Fonts : Cache-First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
    return;
  }

  // 3. Assets statiques locaux (JS, CSS, Images, Icons, Vite Bundles) : Stale-While-Revalidate / Cache-First
  if (url.origin === self.location.origin) {
    // Si c'est un asset compilé avec hash dans /assets/, c'est immuable -> Cache-First
    const isHashedAsset = url.pathname.startsWith('/assets/');

    if (isHashedAsset) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          });
        })
      );
      return;
    }

    // Autres fichiers locaux : Network avec fallback cache et mise à jour
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Photos et fichiers du bucket Supabase Storage : Cache pour affichage hors-ligne des photos d'élèves
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
    return;
  }

  // Requêtes par défaut
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});
