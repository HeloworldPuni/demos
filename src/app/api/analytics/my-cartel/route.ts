import { NextRequest, NextResponse } from "next/server";
import { enforcePayment } from "@/lib/x402-server";

const PAYMENT_CONFIG = {
    receiver: process.env.PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
    network: process.env.X402_NETWORK || "base-sepolia",
    routes: [
        {
            path: "/api/analytics/my-cartel",
            price: "$0.01",
            description: "Detailed cartel analytics (shares, raids, earnings)",
        }
    ]
};

// detailed analytics for a given address (for dashboards / agents)
export async function GET(req: NextRequest) {
    // 1. Enforce Payment
    const paymentResponse = await enforcePayment(req, PAYMENT_CONFIG);
    if (paymentResponse) return paymentResponse;

    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
        return NextResponse.json(
            { error: "Missing address" },
            { status: 400 }
        );
    }

    // TODO: replace with real data from DB/contracts.
    const mock = {
        address,
        shares: 420,
        rank: 12,
        raidsByYou: 7,
        raidsOnYou: 3,
        highStakesByYou: 2,
        profitClaimed24h: "5.25",
        pendingRewards: "1.10",
    };

    return NextResponse.json(mock);
}
