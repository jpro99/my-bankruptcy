"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { WALKTHROUGH_OFF_KEY } from "./test-walkthrough";

interface TestModeContextValue {
  testMode: boolean;
  walkthroughEnabled: boolean;
  setWalkthroughEnabled: (on: boolean) => void;
  appHref: (path: string) => string;
}

const TestModeContext = createContext<TestModeContextValue | null>(null);

const LINK_SKIP_PREFIXES = ["/test", "/portal", "/signup", "http", "mailto:", "#"];

function shouldPrefixHref(href: string, testMode: boolean): boolean {
  if (!testMode) return false;
  if (!href.startsWith("/")) return false;
  return !LINK_SKIP_PREFIXES.some((p) => href.startsWith(p));
}

export function TestModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const testMode = pathname.startsWith("/test");
  const [walkthroughEnabled, setWalkthroughEnabledState] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWalkthroughEnabledState(window.localStorage.getItem(WALKTHROUGH_OFF_KEY) !== "1");
  }, []);

  const setWalkthroughEnabled = useCallback((on: boolean) => {
    setWalkthroughEnabledState(on);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WALKTHROUGH_OFF_KEY, on ? "0" : "1");
    }
  }, []);

  const appHref = useCallback(
    (path: string) => {
      if (!testMode) return path;
      if (path.startsWith("/test")) return path;
      return `/test${path.startsWith("/") ? path : `/${path}`}`;
    },
    [testMode]
  );

  useEffect(() => {
    if (!testMode || typeof document === "undefined") return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href || !shouldPrefixHref(href, true)) return;
      if (anchor.target === "_blank") return;
      event.preventDefault();
      router.push(`/test${href}`);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [testMode, router]);

  const value = useMemo(
    () => ({ testMode, walkthroughEnabled, setWalkthroughEnabled, appHref }),
    [testMode, walkthroughEnabled, setWalkthroughEnabled, appHref]
  );

  return <TestModeContext.Provider value={value}>{children}</TestModeContext.Provider>;
}

export function useTestMode(): TestModeContextValue {
  const ctx = useContext(TestModeContext);
  if (!ctx) {
    return {
      testMode: false,
      walkthroughEnabled: false,
      setWalkthroughEnabled: () => {},
      appHref: (path: string) => path,
    };
  }
  return ctx;
}
