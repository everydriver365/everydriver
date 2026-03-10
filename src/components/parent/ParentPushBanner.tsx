import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParentPushBannerProps {
  parentPhone: string;
}

export function ParentPushBanner({ parentPhone }: ParentPushBannerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExisting();
    }
  }, [parentPhone]);

  const checkExisting = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { data } = await (supabase as any)
          .from("parent_push_subscriptions")
          .select("id")
          .eq("parent_phone", parentPhone)
          .eq("endpoint", sub.endpoint)
          .maybeSingle();
        setIsSubscribed(!!data);
      }
    } catch {}
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { toast.error("Notifications blocked"); return; }

      const { data: keyData } = await supabase.functions.invoke("get-vapid-public-key");
      if (!keyData?.publicKey) { toast.error("Setup error"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyData.publicKey,
      });

      const subJson = sub.toJSON();
      await (supabase as any).from("parent_push_subscriptions").insert({
        parent_phone: parentPhone,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      });

      setIsSubscribed(true);
      toast.success("Notifications enabled!");
    } catch (err) {
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await (supabase as any).from("parent_push_subscriptions").delete().eq("parent_phone", parentPhone).eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch {
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  if (isSubscribed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">Notifications enabled</span>
          </div>
          <Button variant="ghost" size="sm" onClick={unsubscribe} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-primary" />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Enable notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get alerts for lesson bookings, completions & payments
            </p>
          </div>
          <Button size="sm" onClick={subscribe} disabled={isLoading || permission === "denied"}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
          </Button>
        </div>
        {permission === "denied" && (
          <p className="text-xs text-destructive mt-2">Blocked in browser settings.</p>
        )}
      </CardContent>
    </Card>
  );
}
