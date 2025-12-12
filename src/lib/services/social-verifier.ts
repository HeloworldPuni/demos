
import fs from 'fs';
import path from 'path';

interface VerificationResult {
    success: boolean;
    reason?: string;
    evidencePath?: string;
}

// MOCK SECRETS - In real app, use process.env
// const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

export async function verifyXFollow(userId: string, userHandle: string, targetHandle: string): Promise<VerificationResult> {
    console.log(`Verifying X Follow: @${userHandle} -> @${targetHandle}`);

    // MOCK LOGIC: Always succeed for now if handle exists
    if (!userHandle) return { success: false, reason: "No X account linked" };

    const evidence = {
        type: 'x_follow',
        userId,
        userHandle,
        targetHandle,
        timestamp: new Date().toISOString(),
        mockApiResult: { following: true }
    };

    const evidencePath = await saveEvidence('x', userId, 'follow', evidence);
    return { success: true, evidencePath };
}

export async function verifyXEngage(userId: string, userHandle: string, tweetId: string): Promise<VerificationResult> {
    console.log(`Verifying X Engage: @${userHandle} on tweet ${tweetId}`);

    if (!userHandle) return { success: false, reason: "No X account linked" };

    const evidence = {
        type: 'x_engage',
        userId,
        userHandle,
        tweetId,
        timestamp: new Date().toISOString(),
        mockApiResult: { liked: true, retweeted: true }
    };

    const evidencePath = await saveEvidence('x', userId, `engage_${tweetId}`, evidence);
    return { success: true, evidencePath };
}

export async function verifyFarcasterCast(userId: string, fid: string, requiredText: string): Promise<VerificationResult> {
    console.log(`Verifying Farcaster Cast: FID ${fid} containing "${requiredText}"`);

    if (!fid) return { success: false, reason: "No Farcaster ID linked" };

    const evidence = {
        type: 'fc_cast',
        userId,
        fid,
        requiredText,
        timestamp: new Date().toISOString(),
        mockApiResult: { casts: [{ text: `Hello ${requiredText}`, hash: '0x123...' }] }
    };

    const evidencePath = await saveEvidence('farcaster', userId, 'cast', evidence);
    return { success: true, evidencePath };
}

async function saveEvidence(platform: string, userId: string, action: string, data: any): Promise<string> {
    const dir = path.join(process.cwd(), 'artifacts', 'evidence', platform);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Sanitize inputs to prevent path traversal
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeAction = action.replace(/[^a-zA-Z0-9_-]/g, '');

    const filename = `${safeUserId}_${safeAction}_${Date.now()}.json`;
    const filePath = path.join(dir, filename);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
}
