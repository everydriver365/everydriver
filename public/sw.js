// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push notification received");

  let data = {
    title: "EveryDriver",
    body: "You have a new notification",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "default",
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.png",
    badge: data.badge || "/favicon.png",
    tag: data.tag || "notification",
    data: data.data,
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url;

  // Type-based fallback when no explicit url was supplied
  if (!url && (data.type === "slot_offer" || data.type === "slot_offer_cancelled") && data.offer_id) {
    url = `/?offer_id=${data.offer_id}`;
  }
  if (!url && data.type === "lesson_completed") {
    url = `/pupil?prompt=feedback`;
  }
  if (!url && data.type === "syllabus_category_complete") {
    const cat = data.category || data.categoryName;
    url = cat ? `/pupil?category=${encodeURIComponent(cat)}` : `/pupil`;
  }
  if (!url && data.type === "test_passed") {
    url = `/pupil?celebrate=pass`;
  }
  if (!url && data.type === "message") {
    url = `/pupil?section=messages`;
  }
  if (!url && data.type === "payment_reminder") {
    url = `/pupil?section=payments`;
  }
  url = url || "/instructor";

  const isAbsolute = typeof url === "string" && /^https?:\/\//i.test(url);
  let isSameOrigin = true;
  if (isAbsolute) {
    try {
      isSameOrigin = new URL(url).origin === self.location.origin;
    } catch (_e) {
      isSameOrigin = false;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Cross-origin (branded custom domain) → always open a fresh window
      if (isAbsolute && !isSameOrigin) {
        if (clients.openWindow) return clients.openWindow(url);
        return;
      }
      // Same-origin → focus existing tab if possible
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
