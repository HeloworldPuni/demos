import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress, farcasterId, inviteCode } = body;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        // 1. Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { walletAddress: walletAddress },
                    { farcasterId: farcasterId ? farcasterId.toString() : undefined }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // 2. Resolve Invite / Referrer (Optional)
        let validInvite = null;
        if (inviteCode) {
            const invite = await prisma.invite.findUnique({
                where: { code: inviteCode },
                include: { creator: true }
            });

            // Soft validation: Only use invite if valid and unused. Ignore otherwise.
            if (invite && (invite.status === 'unused' || invite.maxUses > invite.usedCount)) {
                validInvite = invite;
            }
        }

        // 3. Create User, Update Invite (if valid), Create Referral (if valid)
        const result = await prisma.$transaction(async (tx) => {
            // Create User
            const newUser = await tx.user.create({
                data: {
                    walletAddress,
                    farcasterId: farcasterId ? farcasterId.toString() : null,
                }
            });

            // Handle Referral Logic if invite was valid
            if (validInvite) {
                const newUsedCount = validInvite.usedCount + 1;
                const newStatus = newUsedCount >= validInvite.maxUses ? 'used' : 'unused';

                await tx.invite.update({
                    where: { id: validInvite.id },
                    data: {
                        usedCount: { increment: 1 },
                        status: newStatus
                    }
                });

                if (validInvite.creatorId) {
                    // Create legacy Referral record (ID based)
                    await tx.referral.create({
                        data: {
                            referrerId: validInvite.creatorId,
                            refereeId: newUser.id,
                            inviteId: validInvite.id,
                            isRewardable: validInvite.type !== 'founder'
                        }
                    });

                    // Create CartelReferral record (Address based) for Clan UI
                    // We need referrer's address. invalidInvite.creator is included in the findUnique above?
                    // Yes, include: { creator: true }
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
            }

            // Generate 3 new INVITES for the new user (now Referral Codes)
            const newInvites = [];
            for (let i = 0; i < 3; i++) {
                newInvites.push({
                    code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
                    creatorId: newUser.id,
                    type: 'user',
                    maxUses: 1000, // Effectively unlimited now, treating as referral code
                    status: 'unused'
                });
            }

            // SQLite / Postgres createMany handling
            // Since we moved to Postgres, createMany is available but safely keeping loop for now or switching if confirmed.
            // Keeping loop for safety as provider switch might be fresh.
            for (const inv of newInvites) {
                await tx.invite.create({ data: inv });
            }

            return { user: newUser, newInvites, referrer: validInvite?.creator };
        });

        return NextResponse.json({
            success: true,
            user: result.user,
            invites: result.newInvites.map(i => i.code),
            referrerAddress: result.referrer?.walletAddress || "0x0000000000000000000000000000000000000000"
        });

    } catch (error) {
        console.error('Error joining with invite:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
