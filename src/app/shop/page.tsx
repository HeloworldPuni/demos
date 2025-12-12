"use client";

import { Checkout, CheckoutButton, CheckoutStatus } from '@coinbase/onchainkit/checkout';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';

// Placeholder or Env Var
const PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID || "my-product-id";

export default function ShopPage() {
    const { address } = useAccount();

    return (
        <main className="min-h-screen bg-[#0B0E12] text-white p-8 font-mono flex flex-col items-center">
            <div className="max-w-4xl w-full text-center mb-12">
                <h1 className="text-4xl font-bold text-emerald-500 mb-4">The Black Market</h1>
                <p className="text-zinc-400">Secure supplies for your cartel operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl">
                {/* Product Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform">
                    <div className="w-64 h-64 bg-zinc-800 rounded-lg mb-6 flex items-center justify-center text-6xl">
                        📦
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cartel Supply Crate</h2>
                    <p className="text-zinc-500 mb-6 text-center">
                        Contains essential resources for your next raid.
                        <br />(Demo Product)
                    </p>
                    <div className="text-xl font-bold text-emerald-400 mb-6">0.01 ETH</div>

                    <div className="w-full">
                        {address ? (
                            <Checkout productId={PRODUCT_ID}>
                                <CheckoutButton
                                    coinbaseBranded={true}
                                    className="w-full"
                                />
                                <CheckoutStatus />
                            </Checkout>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm text-red-400">Connect Wallet to Purchase</p>
                                <Wallet>
                                    <ConnectWallet className="bg-emerald-600 text-white hover:bg-emerald-700">
                                        <Avatar className="h-6 w-6" />
                                        <Name />
                                    </ConnectWallet>
                                </Wallet>
                            </div>
                        )}

                        {!process.env.NEXT_PUBLIC_PRODUCT_ID && (
                            <p className="mt-4 text-xs text-yellow-500">
                                *Admin Note: Set `NEXT_PUBLIC_PRODUCT_ID` in env to enable real payments.
                            </p>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col justify-center space-y-6 text-zinc-400">
                    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <h3 className="text-white font-bold mb-2">Zero Fees</h3>
                        <p className="text-sm">Pay directly onchain. No credit card fees, no chargebacks.</p>
                    </div>
                    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <h3 className="text-white font-bold mb-2">Instant Settlement</h3>
                        <p className="text-sm">Assets delivered immediately upon blockchain confirmation.</p>
                    </div>
                    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <h3 className="text-white font-bold mb-2">Global Access</h3>
                        <p className="text-sm">Available to anyone, anywhere with a Base wallet.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
