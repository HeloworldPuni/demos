import { NextRequest, NextResponse } from "next/server";
import { enforcePayment } from "@/lib/x402-server";

const PAYMENT_CONFIG = {
    receiver: process.env.PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
    network: process.env.X402_NETWORK || "base-sepolia",
    routes: [
        {
            path: "/api/agent/suggest-raid",
            price: "$0.005",
            description: "Raid target suggestion from Base Cartel AI",
        }
    ]
};

// returns a suggested raid target for a given address
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

    // TODO: use real logic based on player’s state.
    // For now, return a mocked suggestion in correct shape.
    const minGain = Math.floor(Math.random() * 20) + 10;
    const maxGain = minGain + Math.floor(Math.random() * 20) + 5;
    const confidence = Math.floor(Math.random() * 36) + 50; // 50-85%

    const result = {
        attacker: address,
        targetHandle: "@UserC",
        targetAddress: "0xTarget...",
        estimatedGainShares: {
            min: minGain,
            max: maxGain
        },
        confidence: confidence, // Percentage
        riskLevel: "high",            // "low" | "medium" | "high"
        reason: "Target has high pot and low defense.",
    };

    return NextResponse.json(result);
}
