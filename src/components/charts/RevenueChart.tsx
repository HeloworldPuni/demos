"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string; // YYYY-MM-DD
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
                if (res.success) {
                    // Recharts needs numbers
                    setData(res.data);
                } else {
                    setError("Failed to load");
                }
            })
            .catch(() => setError("Network Error"))
            .finally(() => setLoading(false));
    }, [range]);

    if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500 animate-pulse">Loading Chart...</div>;
    if (error) return <div className="h-32 flex items-center justify-center text-xs text-red-500">Unavailable</div>;
    if (data.length === 0) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500">No data</div>;

    return (
        <div className="w-full h-32 mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4FF0E6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4FF0E6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#4FF0E6' }}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                        formatter={(value: number) => [`$${value.toFixed(3)}`, 'Revenue']}
                        labelFormatter={(label) => label.slice(5)} // Show MM-DD
                        cursor={{ stroke: '#4FF0E6', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4FF0E6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
