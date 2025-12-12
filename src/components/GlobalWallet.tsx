"use client";

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';

export function GlobalWallet() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: 'none',
                zIndex: -9999,
                overflow: 'hidden'
            }}
        >
            <Wallet>
                <ConnectWallet className="global-connect-wallet-trigger" />
            </Wallet>
        </div>
    );
}
