import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { count = 1, secret } = body;

        // Simple admin protection
        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const invites = [];
        for (let i = 0; i < count; i++) {
            // Generate a short code: BASE-XXXXXX
            const shortCode = 'BASE-' + uuidv4().substring(0, 6).toUpperCase();

            invites.push({
                code: shortCode,
                type: 'founder',
                maxUses: 1,
                status: 'unused'
            });
        }

        // Create invites in DB
        // Note: createMany is not supported in SQLite, so we use a transaction or loop
        // For SQLite compatibility, we'll use a transaction
        const createdInvites = await prisma.$transaction(
            invites.map((invite) => prisma.invite.create({ data: invite }))
        );

        return NextResponse.json({
            success: true,
            count: createdInvites.length,
            invites: createdInvites.map((i: any) => i.code)
        });

    } catch (error) {
        console.error('Error generating invites:', error);
        return NextResponse.json({ success: false, error: (error as any).message, stack: (error as any).stack }, { status: 200 });
    }
}
