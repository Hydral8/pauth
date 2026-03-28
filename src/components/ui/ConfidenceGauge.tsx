import { useEffect, useRef, useState } from "react";

const SIZE = 160;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ConfidenceGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const from = 0;
    const to = Math.min(Math.max(value, 0), 100);

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const offset = CIRCUMFERENCE - (animated / 100) * CIRCUMFERENCE;
  const displayValue = Math.round(animated);

  // Color shifts: red → amber → purple → green
  function getColor(v: number) {
    if (v < 30) return "#ef4444";
    if (v < 60) return "#f59e0b";
    if (v < 85) return "#8b5cf6";
    return "#10b981";
  }
  const strokeColor = getColor(animated);

  return (
    <div className="gauge">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="gauge-svg"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={STROKE}
        />
        {/* Filled arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke 0.4s ease" }}
        />
      </svg>
      <div className="gauge-label">
        <span className="gauge-value">{displayValue}%</span>
        <span className="gauge-caption">{label}</span>
      </div>
    </div>
  );
}
