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
    ensRegistry: {
      address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const, // Standard Registry (Checksum Verified)
    },
    // Universal Resolver for L2 - This is the key for wagmi useEnsName to resolve on L2
    ensUniversalResolver: {
      address: '0xC6D566A56A1aFF6508b41F6C45F4CD8EE5d130BF' as const, // L2 Resolver (Checksum Verified)
      blockCreated: 24712949, // Optimization
    },
    // Multicall3 is needed for batching
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
      blockCreated: 5022,
    },
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
