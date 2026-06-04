"use client";

import React from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { AttendanceSummary } from "@/lib/types";

interface AttendancePieChartProps {
  data: AttendanceSummary;
}

const COLORS = [
  { key: "hadir", label: "Hadir", color: "#16a34a" },
  { key: "izin", label: "Izin", color: "#008CBA" },
  { key: "sakit", label: "Sakit", color: "#d97706" },
  { key: "alpa", label: "Alpa", color: "var(--danger-text)" },
];

export default function AttendancePieChart({ data }: AttendancePieChartProps) {
  const chartData = COLORS.map((c) => ({
    name: c.label,
    value: data[c.key as keyof AttendanceSummary] as number,
    color: c.color,
  })).filter((d) => d.value > 0);

  return (
    <div style={{ width: "100%", flex: 1, minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
            animationBegin={200}
            animationDuration={800}
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              fontSize: "0.8rem",
              color: "var(--text-main)",
            }}
            formatter={(value, name) => [
              `${value} rapat`,
              name,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
