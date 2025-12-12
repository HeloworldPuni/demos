
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { token, url, userFid } = await req.json();

        if (!token || !userFid) {
            return NextResponse.json({ error: "Missing token or userFid" }, { status: 400 });
        }

        const fidString = String(userFid);

        await prisma.notificationToken.create({
            data: {
                token,
                url: url || "",
                fid: fidString,
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to save notification token:", error);
        // Handle unique constraint violation gracefully (already saved)
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ success: true, message: "Token already exists" });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
