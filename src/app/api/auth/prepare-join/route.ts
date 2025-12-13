import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, farcasterId, inviteCode } = body;

        console.log(`[PrepareJoin] Request for ${walletAddress}`);

        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        // 1. IDEMPOTENCY CHECK: Does user exist?
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { walletAddress: walletAddress },
                    { farcasterId: farcasterId ? farcasterId.toString() : undefined }
                ]
            }
        });

        if (existingUser) {
            console.log(`[PrepareJoin] User exists: ${existingUser.id}`);
            // If user exists, find their referrer to ensure consistency? 
            // Or just return default. For now, returning default or looking up existing referral.
            const referral = await prisma.cartelReferral.findFirst({
                where: { userAddress: walletAddress }
            });

            return NextResponse.json({
                success: true,
                isNewUser: false,
                referrerAddress: referral?.referrerAddress || "0x0000000000000000000000000000000000000000"
            });
        }

        // 2. NEW USER LOGIC
        // Validate Invite
        let validInvite = null;
        if (inviteCode) {
            const invite = await prisma.invite.findUnique({
                where: { code: inviteCode },
                include: { creator: true }
            });

            // Soft validation
            if (invite && (invite.status === 'unused' || invite.maxUses > invite.usedCount)) {
                validInvite = invite;
            }
        }

        // 3. Create DB Record (Pre-fill)
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    walletAddress,
                    farcasterId: farcasterId ? farcasterId.toString() : null,
                    active: true, // Mark active immediately so Profile works
                    shares: 0 // Will be synced from chain later
                }
            });

            if (validInvite) {
                // Update Invite Stats
                await tx.invite.update({
                    where: { id: validInvite.id },
                    data: {
                        usedCount: { increment: 1 },
                        status: (validInvite.usedCount + 1 >= validInvite.maxUses) ? 'used' : 'unused'
                    }
                });

                // Link Referral
                if (validInvite.creator?.walletAddress) {
                    await tx.cartelReferral.create({
                        data: {
                            userAddress: walletAddress,
                            referrerAddress: validInvite.creator.walletAddress,
                            season: 1
                        }
                    });
                }
            }

            // Generate Invites for New User
            const newInvites = Array.from({ length: 3 }).map(() => ({
                code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
                creatorId: newUser.id,
                type: 'user',
                maxUses: 1000,
                status: 'unused'
            }));

            for (const inv of newInvites) {
                await tx.invite.create({ data: inv });
            }

            return { user: newUser, referrer: validInvite?.creator };
        });

        console.log(`[PrepareJoin] Created new user: ${result.user.id}`);

        return NextResponse.json({
            success: true,
            isNewUser: true,
            referrerAddress: result.referrer?.walletAddress || "0x0000000000000000000000000000000000000000"
        });

    } catch (error) {
        console.error('[PrepareJoin] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
