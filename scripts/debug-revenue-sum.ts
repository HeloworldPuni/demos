import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Robust Env Loading
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
        console.log(`[Debug] Loading env from: ${envPath}`);
        dotenv.config({ path: envPath, override: true });
    }
}

console.log(`[Debug] DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
// console.log(`[Debug] DATABASE_URL: ${process.env.DATABASE_URL}`); // Uncomment if desperate

const prisma = new PrismaClient();

async function main() {
    console.log("--- 24h REVENUE DIAGNOSTIC ---");

    // 1. Verify Query Logic (Simulated)
    console.log("[Logic] Query: prisma.cartelEvent.aggregate({ _sum: { feePaid: true }, where: { timestamp: { gte: yesterday } } })");
    console.log("[Logic] Timestamp Field: `timestamp` (DateTime)");
    console.log("[Logic] feePaid Type: `Float?` (Nullable Float)");

    // 2. Query WITHOUT Filter
    console.log("\n--- QUERY: ALL TIME ---");
    const allTimeAgg = await prisma.cartelEvent.aggregate({
        _sum: { feePaid: true }
    });
    const allTimeCount = await prisma.cartelEvent.count();
    console.log(`[Result] Row Count: ${allTimeCount}`);
    console.log(`[Result] Sum feePaid: ${allTimeAgg._sum.feePaid}`);

    // 3. Query WITH 24h Filter
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    console.log(`\n--- QUERY: LAST 24H (Since ${yesterday.toISOString()}) ---`);

    const recentAgg = await prisma.cartelEvent.aggregate({
        _sum: { feePaid: true },
        where: { timestamp: { gte: yesterday } }
    });
    const recentCount = await prisma.cartelEvent.count({
        where: { timestamp: { gte: yesterday } }
    });

    console.log(`[Result] Row Count: ${recentCount}`);
    console.log(`[Result] Sum feePaid: ${recentAgg._sum.feePaid}`);

    // 4. Inspect Sample Rows to check values
    if (recentCount > 0) {
        console.log("\n--- SAMPLE ROWS (Last 5) ---");
        const samples = await prisma.cartelEvent.findMany({
            where: { timestamp: { gte: yesterday } },
            orderBy: { timestamp: 'desc' },
            take: 5,
            select: { id: true, type: true, feePaid: true, timestamp: true }
        });
        console.table(samples);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
