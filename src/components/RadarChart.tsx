import { useMemo } from 'react';

const LABELS = ['便利度', '稀缺性', '人气', '品牌', '空间', '周边', '新鲜度'];
const KEYS = ['scoreAccessibility', 'scoreRarity', 'scorePopularity', 'scoreBrand', 'scoreSpace', 'scoreAmenity', 'scoreFreshness'] as const;

export default function RadarChart({ props }: { props: Record<string, unknown> }) {
  const values = useMemo(() => KEYS.map(k => (props[k] as number | undefined) ?? 50), [props]);
  const avg = useMemo(() => Math.round(values.reduce((a, b) => a + b, 0) / values.length), [values]);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 60;
  const n = values.length;

  const points = values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (v / 100) * radius;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const grid = Array.from({ length: 5 }, (_, i) => {
    const r = ((i + 1) / 5) * radius;
    return Array.from({ length: n }, (_, j) => {
      const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  });

  const labelPos = LABELS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + (radius + 18) * Math.cos(angle), y: cy + (radius + 18) * Math.sin(angle) };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((g, i) => (
          <polygon key={i} points={g} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}
        {LABELS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return (
            <line key={i}
              x1={cx} y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke="rgba(255,255,255,0.08)" strokeWidth={1}
            />
          );
        })}
        <polygon points={points} fill="rgba(232,166,73,0.25)" stroke="#e8a649" strokeWidth={2} />
        {values.map((v, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (v / 100) * radius;
          return (
            <circle key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3} fill="#e8a649"
            />
          );
        })}
        {labelPos.map((p, i) => (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)" fontSize={10}>{LABELS[i]}</text>
        ))}
      </svg>
      <div className="text-2xl font-bold text-accent mt-1">{avg}<span className="text-sm text-white/40 ml-1">/100</span></div>
    </div>
  );
}
