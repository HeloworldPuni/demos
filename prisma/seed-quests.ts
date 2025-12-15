
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
    console.log('Seeding quests...');

    const quests = [
        // A. DAILY OPS
        {
            slug: 'daily-raid-once',
            title: 'Raid a Rival',
            description: 'Execute at least one raid on another player.',
            category: 'GAMEPLAY',
            frequency: 'DAILY',
            rewardRep: 10,
            rewardShares: 0,
            maxCompletions: 1
        },
        {
            slug: 'daily-claim-once',
            title: 'Claim Profit',
            description: 'Claim your share of the daily revenue pot.',
            category: 'GAMEPLAY',
            frequency: 'DAILY',
            rewardRep: 5,
            rewardShares: 0,
            maxCompletions: 1
        },
        {
            slug: 'daily-invite-once',
            title: 'Invite a Friend',
            description: 'Share your invite code with a friend.',
            category: 'REFERRAL',
            frequency: 'DAILY',
            rewardRep: 8,
            rewardShares: 0,
            maxCompletions: 1
        },

        // B. WEEKLY SYNDICATE
        {
            slug: 'weekly-five-raids',
            title: 'Execute 5 Raids',
            description: 'Perform 5 successful raids in a week.',
            category: 'GAMEPLAY',
            frequency: 'WEEKLY',
            rewardRep: 50,
            rewardShares: 0,
            maxCompletions: 1
        },
        {
            slug: 'weekly-high-stakes',
            title: 'Go High-Stakes',
            description: 'Perform a High Stakes Raid.',
            category: 'GAMEPLAY',
            frequency: 'WEEKLY',
            rewardRep: 100,
            rewardShares: 0,
            maxCompletions: 1
        },

        // C. SOCIAL GROWTH
        {
            slug: 'social-follow',
            title: 'Follow @BaseCartel',
            description: 'Follow the official account on X.',
            category: 'SOCIAL',
            frequency: 'ONE_TIME',
            rewardRep: 15,
            rewardShares: 0,
            maxCompletions: 1
        },
        {
            slug: 'social-engage-announce',
            title: 'Like & Retweet Launch',
            description: 'Engage with the launch announcement.',
            category: 'SOCIAL',
            frequency: 'ONE_TIME',
            rewardRep: 20,
            rewardShares: 0,
            maxCompletions: 1
        },
        {
            slug: 'farcaster-cast',
            title: 'Cast about Base Cartel',
            description: 'Share your cartel link on Farcaster.',
            category: 'SOCIAL',
            frequency: 'ONE_TIME',
            rewardRep: 25,
            rewardShares: 0,
            maxCompletions: 1
        },

        // D. REFERRAL (Shares Pending)
        {
            slug: 'refer-1',
            title: 'Bring 1 New Player',
            description: 'Refer a new player who joins the cartel.',
            category: 'REFERRAL',
            frequency: 'SEASONAL',
            rewardRep: 0,
            rewardShares: 20,
            maxCompletions: 9999 // Unlimited, capped by service logic
        },
        {
            slug: 'refer-3',
            title: 'Bring 3 New Players',
            description: 'Refer 3 new players.',
            category: 'REFERRAL',
            frequency: 'SEASONAL',
            rewardRep: 0,
            rewardShares: 75,
            maxCompletions: 9999
        },
        {
            slug: 'refer-10',
            title: 'Bring 10 Players (Season)',
            description: 'Refer 10 players this season.',
            category: 'REFERRAL',
            frequency: 'SEASONAL',
            rewardRep: 0,
            rewardShares: 500,
            maxCompletions: 9999
        }
    ];

    for (const q of quests) {
        await prisma.quest.upsert({
            where: { slug: q.slug },
            update: {
                title: q.title,
                description: q.description,
                category: q.category as any,
                frequency: q.frequency as any,
                rewardRep: q.rewardRep,
                rewardShares: q.rewardShares,
                maxCompletions: q.maxCompletions
            },
            create: {
                slug: q.slug,
                title: q.title,
                description: q.description,
                category: q.category as any,
                frequency: q.frequency as any,
                rewardRep: q.rewardRep,
                rewardShares: q.rewardShares,
                maxCompletions: q.maxCompletions
            }
        });
        console.log(`Upserted quest: ${q.slug}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
