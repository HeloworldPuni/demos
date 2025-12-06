import { fetch } from "undici";

async function main() {
    let baseUrl = "http://localhost:3000";

    // Quick check if 3000 is reachable, else try 3001
    try {
        await fetch(baseUrl);
    } catch (e) {
        console.log("Port 3000 unreachable, trying 3001...");
        baseUrl = "http://localhost:3001";
    }

    const endpoint = `${baseUrl}/api/agent/suggest-raid?address=0x123`;
    console.log(`Targeting: ${endpoint}`);

    console.log("1. Testing Free Request (Expect 402)...");
    const res = await fetch(endpoint);

    if (res.status === 402) {
        console.log("✅ Received 402 Payment Required");
        const requirements = await res.json();
        console.log("Requirements:", JSON.stringify(requirements, null, 2));

        console.log("\n2. Testing Paid Request (Expect 200)...");
        const mockPayment = JSON.stringify({
            txHash: "0xmock_tx",
            amount: "5000",
            receiver: requirements.receiver
        });

        const paidRes = await fetch(endpoint, {
            headers: { "X-PAYMENT": mockPayment }
        });

        if (paidRes.status === 200) {
            console.log("✅ Received 200 OK");
            const data = await paidRes.json();
            console.log("Data:", JSON.stringify(data, null, 2));
        } else {
            console.error("❌ Failed: Expected 200, got", paidRes.status);
            console.error(await paidRes.text());
        }

    } else {
        console.error("❌ Failed: Expected 402, got", res.status);
        console.error(await res.text());
    }
}

main().catch(console.error);
