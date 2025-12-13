import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                invites: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // AUTO-GENERATE INVITES IF MISSING (Self-Healing)
        let finalInvites = user.invites;

        if (finalInvites.length === 0) {
            console.log(`[InvitesAPI] User ${walletAddress} has 0 invites. Generating backups...`);
            const { v4: uuidv4 } = require('uuid');

            const newInvitesData = Array.from({ length: 3 }).map(() => ({
                code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
                creatorId: user.id,
                type: 'user',
                maxUses: 1000,
                status: 'unused'
            }));

            // Execute creation in transaction to ensure they are saved
            await prisma.$transaction(
                newInvitesData.map(inv => prisma.invite.create({ data: inv }))
            );

            // Fetch again to ensure we have the full objects with timestamps
            const updatedUser = await prisma.user.findUnique({
                where: { walletAddress },
                include: { invites: { orderBy: { createdAt: 'desc' } } }
            });

            if (updatedUser) {
                finalInvites = updatedUser.invites;
            }
        }

        return NextResponse.json({
            invites: finalInvites.map(invite => ({
                code: invite.code,
                status: invite.status,
                type: invite.type,
                createdAt: invite.createdAt,
            }))
        });

    } catch (error) {
        console.error('Error fetching invites:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
