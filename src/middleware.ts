import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match nothing or keep empty to disable
    ],
};
