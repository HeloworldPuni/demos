// Client-side helper for x402 payments
// Updated to match official x402 protocol flow

// Note: In a real production app, we would use the @coinbase/x402 SDK's
// createAuthorizationHeader function. For this demo, we'll implement
// the flow manually to ensure transparency and control.

interface PaymentRequirements {
    receiver: string;
    scheme: {
        type: string;
        chainId: number;
        tokenAddress: string;
        amount: string; // BigInt serialized as string
    };
    description?: string;
}

export async function callPaidEndpoint<T = any>(endpoint: string): Promise<T> {
    // 1. Initial request
    const res = await fetch(endpoint);

    if (res.status !== 402) {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return (await res.json()) as T;
    }

    const requirements = await res.json() as PaymentRequirements;

    // Safety checks
    if (!requirements.receiver || !requirements.scheme) {
        throw new Error("Invalid x402 payment requirements from server");
    }

    // 2. Create Payment Logic
    // In a real app, this would trigger a wallet transaction.
    // For this demo/testnet, we simulate the payment creation.
    // The server (x402-server.ts) currently accepts any non-empty X-PAYMENT header for testing.

    console.log("[x402-client] Payment Required:", requirements);

    // TODO: Integrate actual wallet payment here using wagmi/viem
    // const tx = await wallet.sendTransaction(...)
    // const proof = ...

    // For now, we construct a mock proof that the server will accept (as per our server implementation)
    const mockPaymentProof = JSON.stringify({
        txHash: "0xmock_tx_hash_" + Date.now(),
        amount: requirements.scheme.amount,
        receiver: requirements.receiver
    });

    // 3. Retry with X-PAYMENT
    const paidRes = await fetch(endpoint, {
        headers: { "X-PAYMENT": mockPaymentProof },
    });

    if (!paidRes.ok) {
        throw new Error(`Paid request failed: ${paidRes.status}`);
    }

    return (await paidRes.json()) as T;
}

// Auto-agent helpers

export async function getRaidSuggestion(address: string) {
    // Use absolute URL for server-side calls, or relative for client-side if proxying
    // Ensure we use the public URL if available, or localhost for dev
    const baseUrl = process.env.BASE_CARTEL_API_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/agent/suggest-raid?address=${address}`;

    return callPaidEndpoint<{
        attacker: string;
        targetHandle: string;
        targetAddress: string;
        estimatedGainShares: number;
        riskLevel: string;
        reason: string;
    }>(url);
}

export async function getCartelAnalytics(address: string) {
    const baseUrl = process.env.BASE_CARTEL_API_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/analytics/my-cartel?address=${address}`;

    return callPaidEndpoint<{
        address: string;
        shares: number;
        rank: number;
        raidsByYou: number;
        raidsOnYou: number;
        highStakesByYou: number;
        profitClaimed24h: string;
        pendingRewards: string;
    }>(url);
}
