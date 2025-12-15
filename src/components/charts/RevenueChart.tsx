"use client";

import { useEffect, useState, useMemo } from 'react';

interface ChartData {
    date: string;
    revenue: number;
}

export default function RevenueChart({ range = '7d' }: { range?: string }) {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/cartel/revenue/chart?range=${range}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data);
                } else {
                    setError("Failed to load");
                }
            })
            .catch(() => setError("Network Error"))
            .finally(() => setLoading(false));
    }, [range]);

    // SCALE LOGIC
    const { points, maxVal, width, height, xLabels } = useMemo(() => {
        if (!data.length) return { points: [], maxVal: 0, width: 0, height: 0, xLabels: [] };

        const h = 120; // Internal height
        const w = 400; // Internal width
        const max = Math.max(...data.map(d => d.revenue), 0.000001) * 1.2;

        const pts = data.map((d, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((d.revenue / max) * h);
            return { x, y, val: d.revenue, date: d.date };
        });

        // Generate X-Axis labels (every other date or simpler)
        const labels = data.map((d, i) => ({
            x: (i / (data.length - 1)) * w,
            label: d.date.slice(5) // MM-DD
        }));

        return { points: pts, maxVal: max, width: w, height: h, xLabels: labels };
    }, [data]);

    if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500 animate-pulse">Loading Chart...</div>;
    if (error) return <div className="h-32 flex items-center justify-center text-xs text-red-500">Unavailable</div>;
    if (data.length === 0) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500">No data</div>;

    // SVG PATHS
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    // Close the area path
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return (
        <div className="w-full h-40 mt-2 relative group select-none">
            {/* Chart Bounds */}
            <svg viewBox={`0 -10 ${width + 40} ${height + 30}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4FF0E6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4FF0E6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-Axis Grid & Labels (3 lines) */}
                {[0, 0.5, 1].map((tick, i) => {
                    const y = height * (1 - tick);
                    const val = maxVal * tick;
                    return (
                        <g key={i}>
                            <line x1="0" y1={y} x2={width} y2={y} stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={width + 10} y={y + 3} fill="#52525b" fontSize="10" fontFamily="monospace">
                                ${val.toFixed(2)}
                            </text>
                        </g>
                    );
                })}

                {/* X-Axis Labels */}
                {xLabels.map((l, i) => (
                    // Show first, last, and maybe middle to avoid crowd? Or just all if <=7
                    (i === 0 || i === xLabels.length - 1 || i % 2 !== 0) && (
                        <text key={i} x={l.x} y={height + 15} textAnchor="middle" fill="#52525b" fontSize="10" fontFamily="monospace">
                            {l.label}
                        </text>
                    )
                ))}

                {/* Area Fill */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Line Stroke */}
                <path d={linePath} fill="none" stroke="#4FF0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Interactive Points */}
                {points.map((p, i) => (
                    <g key={i}>
                        {/* Hit Area */}
                        <rect
                            x={p.x - (width / points.length) / 2}
                            y="0"
                            width={width / points.length}
                            height={height}
                            fill="transparent"
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(null)}
                            className="cursor-crosshair"
                        />
                        {/* Hover Dot */}
                        {hoverIndex === i && (
                            <circle cx={p.x} cy={p.y} r="4" fill="#18181b" stroke="#4FF0E6" strokeWidth="2" />
                        )}
                    </g>
                ))}
            </svg>

            {/* Tooltip Overlay (HTML for sharpness) */}
            {hoverIndex !== null && points[hoverIndex] && (
                <div
                    className="absolute top-0 transform -translate-x-1/2 -translate-y-full bg-zinc-900 border border-zinc-700 text-xs px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-20"
                    style={{ left: `${(points[hoverIndex].x / width) * 100}%`, top: '20%' }}
                >
                    <div className="text-zinc-500 font-bold mb-0.5">{points[hoverIndex].date}</div>
                    <div className="text-[#4FF0E6] font-bold text-sm">
                        ${points[hoverIndex].val.toFixed(3)}
                    </div>
                </div>
            )}
        </div>
    );
}
