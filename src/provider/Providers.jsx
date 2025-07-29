"use client";

import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import dynamic from "next/dynamic";
import config from "@/lib/wagmiConfig";

const queryClient = new QueryClient();

const ReactTogetherWrapper = dynamic(() => import("./ReactTogetherWrapper"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Providers({ children }) {
  return (
    <ReactTogetherWrapper>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ReactTogetherWrapper>
  );
}
