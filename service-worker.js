// ===== Service Worker สำหรับ StockNest PWA =====
const CACHE_NAME = 'stocknest-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/apexcharts'
];

// 1. ติดตั้ง Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: กำลัง Cache ไฟล์...');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// 2. เปิดใช้งาน Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: ลบ Cache เก่า:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// 3. จัดการ Request (Network-first แล้ว fallback Cache)
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // ถ้าได้ response สำเร็จ ให้ clone และเก็บใน cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(function() {
                // ถ้า network ไม่ได้ ให้ใช้ cache
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        // ถ้าไม่มี cache และ network ไม่ได้ ให้แสดงหน้า offline
                        return new Response('📡 ไม่มีการเชื่อมต่ออินเทอร์เน็ต', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});