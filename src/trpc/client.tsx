"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/trpc/routers/_app";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Create TRPC client with credentials included
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        transformer:superjson,
        url: `${getBaseUrl()}/api/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include", // ✅ ensures cookies are sent
          });
        },
        headers() {
          if (typeof window === "undefined") return {};
          const token = localStorage.getItem("token");
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = React.useState(() => createTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}



