"use client";

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';
import WagmiProvider from "~/components/providers/WagmiProvider";
import FrameProvider from "~/components/providers/FrameProvider";

import { SharedCastHandler } from "~/components/farcaster/SharedCastHandler";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnchainKitProvider
      chain={base}
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
      config={{
        appearance: {
          mode: 'dark',
          theme: 'default',
        },
        wallet: {
          display: 'modal',
          termsUrl: 'https://www.base.org/terms-of-service',
          privacyUrl: 'https://www.base.org/privacy-policy',
        },
      }}
    >
      <FrameProvider>
        <SharedCastHandler />
        <WagmiProvider>{children}</WagmiProvider>
      </FrameProvider>
    </OnchainKitProvider>
  );
}
