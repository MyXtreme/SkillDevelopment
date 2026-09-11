import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import type { SpeedPoint } from "./analyzer";
import { useMemo, useState } from "react";
import speedGraphStyles from "../components/typing-results.module.css";
import clsx from "clsx";

interface SpeedChartProps {
  speedPoints: SpeedPoint[];
  averageWpm: number | null;
  showRaw: boolean;
}
export function SpeedChart({
  speedPoints: data,
  averageWpm,
  showRaw = true,
}: SpeedChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const avg = useMemo(() => {
    if (averageWpm !== null) return averageWpm;
    if (!data.length) return 0;
    return data.reduce((sum, cur) => sum + cur.wpm, 0) / data.length;
  }, [data, averageWpm]);

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  return (
    <div className={speedGraphStyles.speedChartRoot}>
      <div className={speedGraphStyles.speedChartHead}>
        <span className={speedGraphStyles.speedChartTitle}>speed</span>
        <div className={speedGraphStyles.speedChartStats}>
          <div className={speedGraphStyles.speedChartStat}>
            <div
              className={clsx(speedGraphStyles.value, speedGraphStyles.accent)}
            >
              {(hovered ? hovered.wpm : avg).toFixed(0)}
            </div>
            <div className={speedGraphStyles.label}>
              {hovered ? "at cursor" : "avg wpm"}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
          onMouseMove={(state) => {
            if (state?.isTooltipActive && state.activeTooltipIndex != null) {
              setHoverIndex(Number(state.activeTooltipIndex));
            } else {
              setHoverIndex(null);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-accent)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-secondary)"
            opacity={0.15}
          />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => `${Math.round(t)}s`}
            tick={{
              fill: "var(--color-secondary)",
              fontSize: 10,
            }}
            stroke="var(--color-secondary)"
            tickLine={false}
          />
          <YAxis
            tick={{
              fill: "var(--color-secondary)",
              fontSize: 12,
            }}
            stroke="var(--color-secondary)"
            tickLine={false}
          />
          <ReferenceLine
            y={avg}
            stroke="var(--text-dim)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="speed-tooltip">
                  <div className="row">
                    <span className="k">t</span>
                    <span className="v">
                      {label !== undefined ? Math.round(Number(label)) : 0}s
                    </span>
                  </div>
                  <div className="row">
                    <span className="k">wpm</span>
                    <span className="v accent">{p.wpm.toFixed(0)}</span>
                  </div>
                  {showRaw && (
                    <div className="row">
                      <span className="k">raw</span>
                      <span className="v">{p.raw.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              );
            }}
          />
          {showRaw && (
            <Area
              type="monotone"
              dataKey="raw"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#speedFill)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--accent)",
              stroke: "var(--bg)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
