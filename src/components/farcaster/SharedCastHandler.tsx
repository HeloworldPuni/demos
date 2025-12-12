"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { User, ArrowRight, ShieldAlert, Activity } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { useReadContract } from "wagmi";
import { NEYNAR_USER_SCORE_ABI, NEYNAR_USER_SCORE_ADDRESS } from "~/lib/contracts/neynar-user-score";
import { baseSepolia } from "viem/chains";

export function SharedCastHandler() {
    const [isOpen, setIsOpen] = useState(false);
    const [castData, setCastData] = useState<any>(null);

    useEffect(() => {
        const checkContext = async () => {
            try {
                const context = await sdk.context;
                if (
                    context &&
                    context.location &&
                    context.location.type === "cast_share"
                ) {
                    const cast = context.location.cast;
                    setCastData(cast);
                    setIsOpen(true);
                }
            } catch (e) {
                console.error("Error checking context:", e);
            }
        };

        checkContext();
    }, []);

    const { data: userScore, isLoading: isScoreLoading } = useReadContract({
        address: NEYNAR_USER_SCORE_ADDRESS,
        abi: NEYNAR_USER_SCORE_ABI,
        functionName: "getScore",
        args: castData ? [BigInt(castData.author.fid)] : undefined,
        chainId: baseSepolia.id,
        query: {
            enabled: !!castData,
        }
    });

    if (!castData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-400">
                        <ShieldAlert className="w-6 h-6" />
                        Intel Received
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        {castData.author.pfpUrl ? (
                            <img
                                src={castData.author.pfpUrl}
                                alt={castData.author.username}
                                className="w-12 h-12 rounded-full border-2 border-zinc-600"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                <User className="w-6 h-6 text-zinc-400" />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-white">
                                {castData.author.displayName || castData.author.username}
                            </p>
                            <p className="text-xs text-emerald-400">
                                @{castData.author.username}
                            </p>
                        </div>
                    </div>

                    <div className="bg-black/40 p-3 rounded border border-zinc-800 text-sm text-zinc-300 italic">
                        "{castData.text}"
                    </div>

                    {/* Trust Score Analysis */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Activity className="w-4 h-4" />
                            <span>Trust Score</span>
                        </div>
                        <div className="font-mono font-bold">
                            {isScoreLoading ? (
                                <span className="text-zinc-500 animate-pulse">Scanning...</span>
                            ) : (
                                <span className={Number(userScore) > 0 ? "text-emerald-400" : "text-red-400"}>
                                    {userScore ? userScore.toString() : "Unverified"}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-center text-xs text-zinc-500">
                        Processing this intel may reveal high-value targets.
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        onClick={() => setIsOpen(false)}
                    >
                        Acknowledge Intel <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
