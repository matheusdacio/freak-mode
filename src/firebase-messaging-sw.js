importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD8KFxq_38kal02zsHDKeozKcN5jdvCiO8',
  authDomain: 'freak-mode.firebaseapp.com',
  projectId: 'freak-mode',
  storageBucket: 'freak-mode.firebasestorage.app',
  messagingSenderId: '823861911777',
  appId: '1:823861911777:web:dc5b07bac8b296d75a97a0',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'FreakMode';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: payload.fcmOptions?.link ?? 'https://freak-mode.web.app' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? 'https://freak-mode.web.app';
  event.waitUntil(clients.openWindow(url));
});
