import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "default";
}

// VAPID public key - this will be fetched from an edge function
let vapidPublicKey: string | null = null;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function usePushNotifications(instructorId: string) {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "default",
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "default",
    }));

    return isSupported;
  }, []);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Check if we have a subscription in the database
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("instructor_id", instructorId)
        .limit(1);

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        isSubscribed: data && data.length > 0,
        isLoading: false,
        permission: Notification.permission,
      }));
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [instructorId, checkSupport]);

  // Fetch VAPID public key from edge function
  const fetchVapidKey = async (): Promise<string | null> => {
    if (vapidPublicKey) return vapidPublicKey;

    try {
      const { data, error } = await supabase.functions.invoke("get-vapid-key");
      if (error) throw error;
      vapidPublicKey = data?.publicKey || null;
      return vapidPublicKey;
    } catch (error) {
      console.error("Error fetching VAPID key:", error);
      return null;
    }
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Get VAPID key
      const publicKey = await fetchVapidKey();
      if (!publicKey) {
        toast({
          title: "Configuration error",
          description: "Push notifications are not configured yet",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          instructor_id: instructorId,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
          user_agent: navigator.userAgent,
        },
        {
          onConflict: "instructor_id,endpoint",
        }
      );

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      toast({
        title: "Notifications enabled",
        description: "You'll receive alerts for new bookings and reminders",
      });

      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Subscription failed",
        description: "Could not enable push notifications",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [instructorId]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("instructor_id", instructorId);

      if (error) throw error;

      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await (registration as any).pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications anymore",
      });

      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Error",
        description: "Could not disable notifications",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [instructorId]);

  // Toggle subscription
  const toggle = useCallback(async () => {
    if (state.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [state.isSubscribed, subscribe, unsubscribe]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggle,
    refresh: checkSubscription,
  };
}
