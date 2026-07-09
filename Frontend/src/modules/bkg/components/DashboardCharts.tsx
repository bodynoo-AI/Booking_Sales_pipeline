import React, { useState } from 'react';
import { getBookingStatusConfig } from './SharedComponents';
import type { BookingStatus } from '../types';

interface StatusDatum {
  status: BookingStatus;
  label: string;
  count: number;
}

interface StatusDonutChartProps {
  data: StatusDatum[];
  size?: number;
  onSelect?: (status: BookingStatus) => void;
  selected?: BookingStatus | null;
}

// A small, dependency-free SVG donut chart used to show booking status
// distribution on the dashboard. Segments are clickable to drill into detail.
export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  size = 168,
  onSelect,
  selected,
}) => {
  const [hovered, setHovered] = useState<BookingStatus | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = size / 2;
  const strokeWidth = size * 0.22;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  if (total === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '14px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 12,
          margin: '0 auto',
        }}
      >
        No data
      </div>
    );
  }

  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      <g transform={`rotate(-90 ${radius} ${radius})`}>
        {data.map((d) => {
          const cfg = getBookingStatusConfig(d.status);
          const fraction = d.count / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          const isActive = hovered === d.status || selected === d.status;
          return (
            <circle
              key={d.status}
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke={cfg.border}
              strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'stroke-width 0.15s, opacity 0.15s' }}
              opacity={selected && selected !== d.status ? 0.35 : 1}
              onMouseEnter={() => setHovered(d.status)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(d.status)}
            />
          );
        })}
      </g>
      <text
        x={radius}
        y={radius - 6}
        textAnchor="middle"
        style={{ fontSize: size * 0.19, fontWeight: 800, fill: '#111827' }}
      >
        {total}
      </text>
      <text x={radius} y={radius + 14} textAnchor="middle" style={{ fontSize: size * 0.075, fill: '#9ca3af', fontWeight: 600 }}>
        BOOKINGS
      </text>
    </svg>
  );
};

interface StatusLegendProps {
  data: StatusDatum[];
  onSelect?: (status: BookingStatus) => void;
  selected?: BookingStatus | null;
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ data, onSelect, selected }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d) => {
        const cfg = getBookingStatusConfig(d.status);
        const pct = Math.round((d.count / total) * 100);
        const isSelected = selected === d.status;
        return (
          <div
            key={d.status}
            onClick={() => onSelect?.(d.status)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 8,
              cursor: onSelect ? 'pointer' : 'default',
              background: isSelected ? '#fdf7f5' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: cfg.border,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 600 }}>{d.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{pct}%</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 18, textAlign: 'right' }}>
                {d.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface RevenueTrendChartProps {
  data: Array<{ month: string; revenue: number }>;
  color?: string;
  height?: number;
}

// Simple dependency-free bar chart for the last N months of revenue.
export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data, color = '#c7361a', height = 140 }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const barWidth = 28;
  const gap = 18;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(chartWidth, 260)} height={height + 30} viewBox={`0 0 ${Math.max(chartWidth, 260)} ${height + 30}`}>
        {data.map((d, i) => {
          const barHeight = (d.revenue / max) * height;
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight + 4;
          const isHovered = hoverIdx === i;
          return (
            <g key={d.month} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              <rect
                x={x}
                y={4}
                width={barWidth}
                height={height}
                rx={6}
                fill="#f3f4f6"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 3)}
                rx={6}
                fill={color}
                opacity={isHovered ? 1 : 0.85}
                style={{ transition: 'opacity 0.15s' }}
              />
              {isHovered && (
                <text
                  x={x + barWidth / 2}
                  y={Math.max(y - 8, 14)}
                  textAnchor="middle"
                  style={{ fontSize: 10.5, fontWeight: 700, fill: '#111827' }}
                >
                  {'\u20b9'}{d.revenue.toLocaleString('en-IN')}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height + 20}
                textAnchor="middle"
                style={{ fontSize: 10.5, fill: '#9ca3af', fontWeight: 600 }}
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
