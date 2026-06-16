"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TestModeProvider } from "@/lib/test-mode";
import { TestModeShell } from "@/components/test/test-mode-shell";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TestModeProvider>
        <TestModeShell>{children}</TestModeShell>
      </TestModeProvider>
    </QueryClientProvider>
  );
}
