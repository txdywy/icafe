import type { CafeFeature } from '../types';

export default function Leaderboard({
  cafes, selectedId, onSelect,
}: {
  cafes: CafeFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="pointer-events-auto w-full md:max-w-sm max-h-[40vh] md:max-h-[60vh] overflow-y-auto rounded-2xl bg-panel border border-panel-border backdrop-blur-xl shadow-2xl">
      <div className="sticky top-0 z-10 p-3 md:p-4 bg-panel/90 backdrop-blur border-b border-panel-border">
        <h3 className="text-sm font-bold text-white">🏆 咖啡馆榜单 ({cafes.length})</h3>
      </div>
      <div className="divide-y divide-white/5">
        {cafes.map((cafe, idx) => {
          const p = cafe.properties;
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left p-3 transition hover:bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  idx < 3 ? 'bg-accent text-coffee-950' : 'bg-white/10 text-white/60'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.name}</div>
                  <div className="text-xs text-white/50 truncate">{p.district} · {p.brand || '独立'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-accent">{p.score}</div>
                  <div className="text-[10px] text-white/40">{p.avgPrice ? `¥${p.avgPrice}` : ''}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
