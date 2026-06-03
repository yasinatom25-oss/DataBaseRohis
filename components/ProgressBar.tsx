"use client";

import React from "react";

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  percentage: number;
  showValues?: boolean;
}

export default function ProgressBar({
  label,
  current,
  target,
  percentage,
  showValues = true,
}: ProgressBarProps) {
  const clampedPct = Math.min(percentage, 100);

  // Blue-based color coding
  const barColor =
    percentage >= 90
      ? "#16a34a"
      : percentage >= 70
        ? "#008CBA"
        : percentage >= 50
          ? "#d97706"
          : "var(--danger-text)";

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "5px",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--text-main)",
          }}
        >
          {label}
        </span>
        {showValues && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {current}/{target}{" "}
            <span style={{ color: barColor, fontWeight: 600 }}>
              ({Math.round(percentage)}%)
            </span>
          </span>
        )}
      </div>
      <div
        style={{
          width: "100%",
          height: "8px",
          background: "var(--hover-bg)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clampedPct}%`,
            background: barColor,
            borderRadius: "99px",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
