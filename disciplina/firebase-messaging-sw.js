// Service worker: recebe as notificações com o app fechado.
// Precisa ficar na MESMA pasta do index.html (raiz do site).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdWdVaqrocHaZEq2bxghzFtLhRE4aGFD4",
  authDomain: "sistema-pesagem-64115.firebaseapp.com",
  projectId: "sistema-pesagem-64115",
  storageBucket: "sistema-pesagem-64115.firebasestorage.app",
  messagingSenderId: "81841243626",
  appId: "1:81841243626:web:5e8aff73a25f5770885e93"
});

const messaging = firebase.messaging();

// O servidor envia só "data", então a notificação é montada aqui.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'Disciplina', {
    body: d.body || '',
    tag: d.tag || 'disciplina',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    renotify: true
  });
});

// Tocar na notificação abre (ou foca) o app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) { if ('focus' in c) return c.focus(); }
      return clients.openWindow('./');
    })
  );
});

// --- Cache do app (abre mesmo sem internet; sempre tenta a rede primeiro) ---
const CACHE = 'disciplina-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then((res) => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then((m) => m || caches.match('index.html')))
  );
});
