
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("Missing DATABASE_URL");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

async function main() {
    console.log("Syncing remote user...");

    // 0xfe09... found from previous context
    const targetPrefix = "0xfe09";
    // Full address from debug-sync attempt: 0xfe09366f2412803b98d249f05ac540d9089980d2
    const fullAddress = "0xfe09366f2412803b98d249f05ac540d9089980d2";

    const user = await prisma.user.findFirst({
        where: { walletAddress: { startsWith: targetPrefix, mode: 'insensitive' } }
    });

    if (user) {
        console.log(`Found live user: ${user.walletAddress}`);
        console.log(`Current Shares: ${user.shares}`);

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                shares: 176,
                lastSeenAt: new Date(),
                active: true
            }
        });
        console.log(`UPDATED to ${updated.shares} shares.`);
    } else {
        console.log(`User starting with ${targetPrefix} NOT found on live DB.`);
        console.log("Creating new user record...");

        await prisma.user.create({
            data: {
                walletAddress: fullAddress,
                shares: 176,
                active: true,
                lastSeenAt: new Date()
            }
        });
        console.log("CREATED user with 176 shares.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
