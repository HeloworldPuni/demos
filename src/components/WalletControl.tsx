"use client";

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';

export function WalletControl() {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }}>
            <Wallet>
                <ConnectWallet id="global-wallet-trigger" className="opacity-0 pointer-events-none" />
            </Wallet>
        </div>
    );
}
