import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Initialize Neynar Client
const config = new Configuration({
    apiKey: process.env.NEYNAR_API_KEY || "temp-key", // Prevent init failure during build if env missing
});
const neynarClient = new NeynarAPIClient(config);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation of webhook structure
        if (!body.data || !body.type) {
            return NextResponse.json({ message: "Invalid webhook data" }, { status: 400 });
        }

        // We only care about cast.created events
        if (body.type !== "cast.created") {
            return NextResponse.json({ message: "Ignored event type" }, { status: 200 });
        }

        const cast = body.data;
        const signerUuid = process.env.SIGNER_UUID;

        if (!signerUuid) {
            console.warn("SIGNER_UUID not set, cannot reply.");
            return NextResponse.json({ message: "Bot disabled (no signer)" }, { status: 200 });
        }

        // Check for trigger keywords (e.g. mention)
        // In a real scenario, the webhook filter takes care of this, but we double check.
        // Let's assume we reply to ALL casts sent to this webhook (filtered by Neynar)

        const authorUsername = cast.author.username;
        const replyTo = cast.hash;
        const text = `gm @${authorUsername}! Join the Cartel.`;

        // Create a Dynamic Frame (as per docs)
        // We link to our Mini App
        const frameLink = process.env.NEXT_PUBLIC_URL || "https://www.basecartel.in";

        const embeds = [
            {
                url: frameLink
            }
        ];

        // Publish Reply
        await neynarClient.publishCast({
            signerUuid,
            text,
            parent: replyTo,
            embeds
        });

        return NextResponse.json({ success: true, message: "Replied to cast" });

    } catch (e: any) {
        console.error("Bot Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
