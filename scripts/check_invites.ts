
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const address = "0xfe09c35AdB9200c90455d31a2BFdfD7e30c48F6d";
    console.log(`Checking invites for: ${address}`);

    const user = await prisma.user.findUnique({
        where: { walletAddress: address },
        include: { invites: true }
    });

    if (!user) {
        console.log("❌ User not found in DB!");
    } else {
        console.log("✅ User found.");
        console.log("Invites:", user.invites);

        if (user.invites.length === 0) {
            console.log("⚠️ User has NO invite codes. This explains why the fallback is active.");
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
