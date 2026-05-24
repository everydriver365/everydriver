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
  // Deep-link based on notification type when no explicit url is provided
  let url = data.url;
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
  url = url || "/instructor";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
