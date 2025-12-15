"use client";

import { useEffect, useState } from 'react';

interface ChartData {
    date: string;
    revenue: number;
}

export default function RevenueChart({ range = '7d' }: { range?: string }) {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/cartel/revenue/chart?range=${range}`)
            .then(res => res.json())
            .then(res => {
                if (res.success && Array.isArray(res.data)) {
                    setData(res.data);
                } else {
                    setData([]); // Safe fallback
                }
            })
            .catch(() => setError("Network Error"))
            .finally(() => setLoading(false));
    }, [range]);

    if (loading) return <div className="h-48 flex items-center justify-center text-xs text-zinc-500 animate-pulse">Loading Chart...</div>;
    if (error) return <div className="h-48 flex items-center justify-center text-xs text-red-500">Unavailable</div>;
    if (data.length === 0) return <div className="h-48 flex items-center justify-center text-xs text-zinc-500">No data</div>;

    const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 0.000001);

    return (
        <div className="w-full h-48 mt-4 flex items-end justify-between gap-1 select-none">
            {data.map((d, i) => {
                const heightPct = Math.max(((d.revenue || 0) / maxRevenue) * 100, 4);
                const dateLabel = (d.date || '??-??').slice(5); // MM-DD

                return (
                    <div key={i} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-700 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            <span className="text-zinc-400">{dateLabel}</span>: <span className="text-[#4FF0E6] font-bold">${(d.revenue || 0).toFixed(3)}</span>
                        </div>

                        {/* Bar */}
                        <div
                            className="w-full max-w-[30px] bg-[#4FF0E6]/20 group-hover:bg-[#4FF0E6] transition-colors rounded-t-sm"
                            style={{ height: `${heightPct}%` }}
                        />

                        {/* X Axis Label */}
                        <div className="mt-2 text-[10px] text-zinc-600 font-mono">
                            {dateLabel}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
