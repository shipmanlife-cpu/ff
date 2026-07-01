const CACHE_NAME = 'sila-v3';
const BASE_URL = 'https://shipmanlife-cpu.github.io/ff/';

const CORE_FILES = [
  '/ff/',
  '/ff/index.html',
  '/ff/manifest.json',
  '/ff/icon-192.png',
  '/ff/icon-512.png',
];

// Установка — кэшируем основные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_FILES).catch(err => {
        console.log('Cache install error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — сначала сеть, при ошибке кэш
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase и внешние API — только сеть
  if (url.includes('firebase') ||
      url.includes('googleapis') ||
      url.includes('gstatic') ||
      url.includes('mqtt') ||
      url.includes('emqx') ||
      url.includes('fonts.')) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // Для основных файлов — сеть с кэшем как запасным
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Сохраняем свежую версию в кэш
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Нет интернета — берём из кэша
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Если нет в кэше — возвращаем главную страницу
          return caches.match('/ff/index.html');
        });
      })
  );
});

// Уведомления
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'СИЛА.СВОБОДА.УСПЕХ', {
    body: data.body || 'Новое уведомление',
    icon: '/ff/icon-192.png',
    badge: '/ff/icon-192.png'
  });
});
