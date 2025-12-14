"use client";

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function DebugInvites() {
    const { address } = useAccount();
    const [debugData, setDebugData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/me/invites?walletAddress=${address}`);
            const data = await res.json();
            setDebugData({ status: res.status, data });
        } catch (e) {
            setDebugData({ error: String(e) });
        } finally {
            setLoading(false);
        }
    };

    if (!address) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 p-4 border border-red-500 rounded text-xs text-white max-w-sm z-[9999]">
            <h3 className="font-bold text-red-400 mb-2">🕵️ DEBUG: INVITE SYSTEM</h3>
            <p>Wallet: {address.slice(0, 6)}...</p>
            <button onClick={checkStatus} className="bg-red-900 px-2 py-1 rounded mt-2">
                {loading ? "Checking API..." : "Check API Status"}
            </button>
            {debugData && (
                <pre className="mt-2 bg-zinc-900 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(debugData, null, 2)}
                </pre>
            )}
        </div>
    );
}
