"use client";

import { useEffect, useState } from "react";

/** Touch phone or narrow viewport — field capture side app */
export function detectMobileClient(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 932px)").matches;
  const ua = navigator.userAgent;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return (coarse && narrow) || mobileUa;
}

export function useIsMobileClient(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(detectMobileClient());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return mobile;
}
