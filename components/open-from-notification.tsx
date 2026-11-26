"use client";

import { useEffect } from "react";

/** A tap on a local reminder opens Home. No-op in a normal browser. */
export function OpenFromNotification() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const handle = await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
          const path = typeof event.notification.extra?.path === "string" ? event.notification.extra.path : "/home";
          if (window.location.pathname !== path) window.location.assign(path);
        });
        if (cancelled) {
          void handle.remove();
          return;
        }
        remove = () => void handle.remove();
      } catch {
        // Older shells, or the website.
      }
    })();
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
  return null;
}
