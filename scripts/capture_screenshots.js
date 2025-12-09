const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function capture() {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 1 });

        // Try both localhost and 127.0.0.1 just in case
        const screens = [
            { name: 'dashboard_preview', url: 'http://localhost:3000/screens/dashboard' },
            { name: 'raid_preview', url: 'http://localhost:3000/screens/raid' },
            { name: 'clan_preview', url: 'http://localhost:3000/screens/clan' },
            { name: 'earnings_preview', url: 'http://localhost:3000/screens/leaderboard' },
        ];

        const outDir = path.join(__dirname, '../public/img');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        console.log("Starting Capture to " + outDir);

        for (const screen of screens) {
            console.log(`Navigating to ${screen.url}...`);
            try {
                // Increase timeout to 120s
                const response = await page.goto(screen.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
                console.log(`Response status: ${response ? response.status() : 'null'}`);

                await new Promise(r => setTimeout(r, 2000));

                const outPath = path.join(outDir, `${screen.name}.png`);
                await page.screenshot({ path: outPath, fullPage: false });
                console.log(`Saved ${outPath}`);
            } catch (e) {
                console.error(`FAILED to capture ${screen.name}:`, e.message);
                // Fallback to localhost if 127 failed?
            }
        }
    } catch (err) {
        console.error("Global capture error:", err);
    } finally {
        if (browser) await browser.close();
        console.log("Done.");
    }
}

capture();
