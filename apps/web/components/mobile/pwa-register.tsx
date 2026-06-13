"use client";

import { useEffect } from "react";

/** Register service worker for Android / Samsung PWA install */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* offline install optional */
    });
  }, []);
  return null;
}
