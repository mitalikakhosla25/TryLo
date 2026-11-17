/**
 * TryLo Reusable Interactive SVG Chart Components
 * Pure React + SVG: High performance, zero runtime dependencies, responsive, print-ready.
 */

import React from 'react';

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 180,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F6F5ED"
            strokeWidth={strokeWidth}
          />

          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#DCE7E3"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
          ) : (
            data.map((seg, i) => {
              const dashLength = (seg.value / total) * circumference;
              const dashOffset = -currentOffset;
              currentOffset += dashLength;

              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out hover:opacity-85"
                />
              );
            })
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          <span className="text-sm sm:text-base font-extrabold text-[#102A35]">
            {centerValue ?? total}
          </span>
          {centerLabel && (
            <span className="text-[10px] text-[#52656B] uppercase font-bold tracking-wider leading-none mt-0.5">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 w-full">
        {data.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#DCE7E3]/50">
              <div className="flex items-center space-x-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[#102A35] font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#102A35]">{seg.value.toLocaleString()}</span>
                <span className="text-[11px] text-[#52656B] w-8 text-right font-mono">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


interface BarChartItem {
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  height?: number;
  valuePrefix?: string;
}

export const BarVelocityChart: React.FC<BarChartProps> = ({
  data,
  height = 140,
  valuePrefix = '',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-[#52656B]">
        No trend data recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-end justify-between gap-2 pt-4 px-2 bg-[#F6F5ED]/40 rounded-2xl border border-[#DCE7E3]"
        style={{ height }}
      >
        {data.map((item, i) => {
          const heightPct = Math.max(12, Math.round((item.value / maxValue) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#102A35] text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap shadow-md z-10">
                {valuePrefix}{item.value.toLocaleString()}
              </div>

              {/* Bar */}
              <div
                className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 ease-out group-hover:opacity-85"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: item.color || '#087C80',
                }}
              />
              {/* Label */}
              <span className="text-[10px] font-medium text-[#52656B] truncate max-w-full pb-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
