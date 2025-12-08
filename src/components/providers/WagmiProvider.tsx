import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia, optimism } from "wagmi/chains";
import { baseAccount, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { METADATA } from "../../lib/utils";

// Define Basename Resolver Addresses (Official from Basenames docs)
// Base Mainnet (8453)
const baseWithEns = {
  ...base,
  contracts: {
    ...base.contracts,
  },
};

export const config = createConfig({
  // Use our modified base chain definition
  chains: [baseSepolia, baseWithEns, optimism],
  transports: {
    [base.id]: http(`https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_CDP_API_KEY}`),
    [baseSepolia.id]: http(`https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_CDP_API_KEY}`),
    [optimism.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
    baseAccount({
      appName: METADATA.name,
      appLogoUrl: METADATA.iconImageUrl,
    }),
    coinbaseWallet({
      appName: METADATA.name,
    }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
