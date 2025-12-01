import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PaymentModal from "./PaymentModal";
import { JOIN_FEE, formatUSDC } from "@/lib/basePay";

interface JoinCartelProps {
    onJoin: () => void;
}

export default function JoinCartel({ onJoin }: JoinCartelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleJoinClick = () => {
        setShowPayment(true);
    };

    const handleConfirmPayment = () => {
        setIsProcessing(true);

        // Simulate payment + contract interaction
        setTimeout(() => {
            setIsProcessing(false);
            setShowPayment(false);
            setIsLoading(true);

            setTimeout(() => {
                onJoin();
            }, 1000);
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-center text-2xl text-red-500 font-black">
                        BASE CARTEL
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-zinc-300">
                        Join the most ruthless syndicate on Base. Earn yield, raid rivals, and climb the ranks.
                    </p>

                    <div className="bg-zinc-950 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Entry Fee</span>
                            <span className="text-green-400 font-bold">{formatUSDC(JOIN_FEE)} USDC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Initial Shares</span>
                            <span className="text-white font-bold">100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Daily Yield</span>
                            <span className="text-purple-400 font-bold">Enabled ✓</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Gas Fees</span>
                            <span className="text-purple-400 font-bold">Sponsored ✨</span>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
                        onClick={handleJoinClick}
                        disabled={isLoading}
                    >
                        {isLoading ? "Joining..." : "Join the Cartel"}
                    </Button>
                </CardContent>
            </Card>

            <PaymentModal
                isOpen={showPayment}
                amount={formatUSDC(JOIN_FEE)}
                action="Join the Cartel"
                onConfirm={handleConfirmPayment}
                onCancel={() => setShowPayment(false)}
                isProcessing={isProcessing}
            />
        </div>
    );
}
