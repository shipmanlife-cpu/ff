const CACHE_NAME = 'sila-app-v1';
const urlsToCache = [
    './',
    './index.html'
];

// Установка и кэширование
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Перехват запросов (офлайн-работа)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если есть в кэше — берём оттуда, иначе — из сети
                return response || fetch(event.request).then(networkResponse => {
                    // Кэшируем новые запросы (например, шрифты/иконки)
                    if (event.request.method === 'GET') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            }).catch(() => {
                // Фоллбек если нет интернета и нет в кэше
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});

// Очистка старого кэша
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});