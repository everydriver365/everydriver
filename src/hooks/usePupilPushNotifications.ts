import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PupilPushState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "default";
}

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

export function usePupilPushNotifications(pupilId: string) {
  const [state, setState] = useState<PupilPushState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "default",
  });

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

  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pupil_push_subscriptions")
        .select("id")
        .eq("pupil_id", pupilId)
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
  }, [pupilId, checkSupport]);

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

  const subscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        toast({
          title: "Permission denied",
          description: "Enable notifications in your browser settings",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      const publicKey = await fetchVapidKey();
      if (!publicKey) {
        toast({
          title: "Not available",
          description: "Push notifications aren't configured yet",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subscriptionJson = subscription.toJSON();

      const { error } = await supabase.from("pupil_push_subscriptions").upsert(
        {
          pupil_id: pupilId,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "pupil_id,endpoint" }
      );

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      toast({
        title: "Notifications enabled!",
        description: "You'll receive alerts for lesson updates and offers",
      });

      return true;
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Subscription failed",
        description: "Could not enable notifications",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [pupilId]);

  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from("pupil_push_subscriptions")
        .delete()
        .eq("pupil_id", pupilId);

      if (error) throw error;

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
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
        description: "You won't receive push notifications",
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
  }, [pupilId]);

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
