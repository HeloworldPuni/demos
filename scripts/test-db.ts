
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
console.log("Testing connection to:", dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : "MISSING");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

async function main() {
    try {
        console.log("Connecting...");
        // Use $queryRaw to bypass model validation initially
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log("Connection OK. Result:", result);

        console.log("Checking User count...");
        const count = await prisma.user.count();
        console.log("User count:", count);
    } catch (e: any) {
        console.error("CONNECTION FAILED:");
        console.error(e.message);
        console.error("Code:", e.code);
        console.error("Meta:", e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
