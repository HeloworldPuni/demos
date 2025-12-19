
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
    const targetPrefix = "0xfe09";
    const user = await prisma.user.findFirst({
        where: { walletAddress: { startsWith: targetPrefix, mode: 'insensitive' } }
    });

    if (user) {
        console.log(`VERIFICATION: User ${user.walletAddress} has ${user.shares} shares.`);
    } else {
        console.log("VERIFICATION: User NOT FOUND.");
    }
}

main().finally(() => prisma.$disconnect());
