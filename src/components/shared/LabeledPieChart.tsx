import { memo, useMemo } from "react";

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface LabeledPieChartProps {
  data: PieChartDataItem[];
  theme: "light" | "dark";
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  labelThreshold?: number;
  formatValue?: (value: number) => string;
}

const DEG_TO_RAD = Math.PI / 180;

export const LabeledPieChart = memo(function LabeledPieChart({
  data,
  theme,
  size = 240,
  innerRadius = 42,
  outerRadius = 60,
  labelThreshold = 0.0,
  formatValue = (v) => `₹${v.toLocaleString("en-IN")}`,
}: LabeledPieChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const slices = useMemo(() => {
    if (total === 0) return [];

    const cx = size / 2;
    const cy = size / 2;
    let currentAngle = -90; // Start from top

    return data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = startAngle * DEG_TO_RAD;
      const endRad = endAngle * DEG_TO_RAD;

      // Outer arc points
      const x1 = cx + outerRadius * Math.cos(startRad);
      const y1 = cy + outerRadius * Math.sin(startRad);
      const x2 = cx + outerRadius * Math.cos(endRad);
      const y2 = cy + outerRadius * Math.sin(endRad);

      // Inner arc points
      const x1Inner = cx + innerRadius * Math.cos(startRad);
      const y1Inner = cy + innerRadius * Math.sin(startRad);
      const x2Inner = cx + innerRadius * Math.cos(endRad);
      const y2Inner = cy + innerRadius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      // SVG path for donut slice
      const path = `
        M ${x1Inner} ${y1Inner}
        L ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x2Inner} ${y2Inner}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
        Z
      `;

      // Label line positions
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = midAngle * DEG_TO_RAD;

      const lineStartX = cx + (outerRadius + 4) * Math.cos(midRad);
      const lineStartY = cy + (outerRadius + 4) * Math.sin(midRad);

      const elbowX = cx + (outerRadius + 18) * Math.cos(midRad);
      const elbowY = cy + (outerRadius + 18) * Math.sin(midRad);

      const isRightSide = Math.cos(midRad) >= 0;
      const lineEndX = elbowX + (isRightSide ? 16 : -16);
      const lineEndY = elbowY;

      return {
        key: `${item.name}-${index}`,
        name: item.name,
        value: item.value,
        color: item.color,
        path,
        percentage,
        lineStartX,
        lineStartY,
        elbowX,
        elbowY,
        lineEndX,
        lineEndY,
        isRightSide,
      };
    });
  }, [data, total, size, innerRadius, outerRadius]);

  if (total === 0 || slices.length === 0) return null;

  const isDark = theme === "dark";
  const textColor = isDark ? "#a1a1aa" : "#71717a";
  const strokeColor = isDark ? "#27272a" : "#ffffff";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      style={{ maxHeight: size - 20 }}
      aria-label="Pie chart"
    >
      {/* Gradient definitions */}
      <defs>
        {slices.map((slice, i) => (
          <linearGradient
            key={slice.key}
            id={`pie-grad-${i}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={slice.color} stopOpacity={1} />
            <stop offset="100%" stopColor={slice.color} stopOpacity={0.7} />
          </linearGradient>
        ))}
      </defs>

      {/* Pie slices */}
      {slices.map((slice, i) => (
        <path
          key={slice.key}
          d={slice.path}
          fill={`url(#pie-grad-${i})`}
          stroke={strokeColor}
          strokeWidth={2}
          className="transition-opacity duration-150 hover:opacity-80"
          style={{ cursor: "pointer" }}
        >
          <title>
            {slice.name}: {formatValue(slice.value)} (
            {(slice.percentage * 100).toFixed(0)}%)
          </title>
        </path>
      ))}

      {/* Labels with connecting lines */}
      {slices.map((slice) =>
        slice.percentage >= labelThreshold ? (
          <g key={`label-${slice.key}`}>
            {/* Connecting line */}
            <path
              d={`M ${slice.lineStartX} ${slice.lineStartY} L ${slice.elbowX} ${slice.elbowY} L ${slice.lineEndX} ${slice.lineEndY}`}
              fill="none"
              stroke={slice.color}
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            {/* Dot at end of line */}
            <circle
              cx={slice.lineEndX}
              cy={slice.lineEndY}
              r={2}
              fill={slice.color}
            />
            {/* Category name */}
            <text
              x={slice.lineEndX + (slice.isRightSide ? 4 : -4)}
              y={slice.lineEndY}
              textAnchor={slice.isRightSide ? "start" : "end"}
              fontSize={9}
              fill={textColor}
              fontWeight={500}
              dominantBaseline="central"
            >
              {slice.name}
            </text>
            {/* Percentage */}
            <text
              x={slice.lineEndX + (slice.isRightSide ? 4 : -4)}
              y={slice.lineEndY + 10}
              textAnchor={slice.isRightSide ? "start" : "end"}
              fontSize={8}
              fill={slice.color}
              fontWeight={600}
              dominantBaseline="central"
            >
              {(slice.percentage * 100).toFixed(0)}%
            </text>
          </g>
        ) : null
      )}
    </svg>
  );
});

export default LabeledPieChart;
