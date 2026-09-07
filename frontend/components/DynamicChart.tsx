"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart
} from "recharts";

export interface ChartSpec {
  chart_type: "bar" | "line" | "donut" | "pie";
  title: string;
  x_key: string;
  y_keys: string[];
  data: Record<string, any>[];
}

// Cal.com Monochromatic + Action Blue Curated Palette
const CAL_PALETTE = [
  "#101010", // Primary Ink
  "#0099ff", // Action Blue
  "#4b5563", // Slate Gray
  "#9ca3af", // Stone Muted
  "#10b981", // Emerald Accent
  "#6366f1"  // Indigo Accent
];

export function DynamicChart({ spec }: { spec: ChartSpec }) {
  if (!spec || !spec.data || spec.data.length === 0) return null;

  // Convert string numeric values to actual numbers for Recharts
  const chartData = spec.data.map((item) => {
    const clean: Record<string, any> = { ...item };
    spec.y_keys.forEach((k) => {
      const num = Number(clean[k]);
      clean[k] = isNaN(num) ? 0 : num;
    });
    return clean;
  });

  // Format numbers nicely
  const formatYAxis = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-xs shadow-md font-sans">
          <p className="font-semibold text-[#101010] mb-1 text-[11px] tracking-tight">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const num = Number(entry.value);
              const formatted = isNaN(num) ? entry.value : num.toLocaleString();
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-[#374151] text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[#6b7280]">{entry.name}</span>
                  </span>
                  <span className="font-semibold text-[#101010] font-mono tabular-nums">{formatted}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-2xs my-2">
      <div className="flex items-center justify-between mb-3 border-b border-[#f3f4f6] pb-2">
        <h4 className="text-xs font-semibold text-[#101010] tracking-tight">{spec.title}</h4>
        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
          {spec.chart_type}
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {spec.chart_type === "line" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 15 }}>
              <defs>
                <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0099ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0099ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey={spec.x_key} stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={formatYAxis} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {spec.y_keys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CAL_PALETTE[idx % CAL_PALETTE.length]}
                  strokeWidth={2}
                  fill="url(#calGradient)"
                />
              ))}
            </AreaChart>
          ) : spec.chart_type === "donut" || spec.chart_type === "pie" ? (
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#6b7280" }} />
              <Pie
                data={chartData}
                dataKey={spec.y_keys[0]}
                nameKey={spec.x_key}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={CAL_PALETTE[idx % CAL_PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 15 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey={spec.x_key} stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={formatYAxis} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#6b7280" }} />
              {spec.y_keys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CAL_PALETTE[idx % CAL_PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
