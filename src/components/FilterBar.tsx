import type { FilterMode } from '../types';

const FILTERS: { key: FilterMode; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '☕' },
  { key: 'office', label: '适合办公', icon: '💻' },
  { key: 'photo', label: '适合拍照', icon: '📷' },
  { key: 'metro', label: '地铁方便', icon: '🚇' },
  { key: 'independent', label: '独立咖啡', icon: '🌿' },
  { key: 'chain', label: '连锁品牌', icon: '🏪' },
  { key: 'rare', label: '高稀缺区', icon: '💎' },
  { key: 'new', label: '新店/活动', icon: '✨' },
];

export default function FilterBar({
  filter, onFilter, search, onSearch, darkMode, onToggleDark,
}: {
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
  search: string;
  onSearch: (s: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  return (
    <div className="pointer-events-auto flex flex-col gap-2 md:gap-3 p-3 md:p-4 rounded-2xl bg-panel border border-panel-border backdrop-blur-xl shadow-2xl max-w-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl md:text-2xl">☕</span>
        <h1 className="text-base md:text-lg font-bold tracking-tight text-white">北京咖啡指数</h1>
        <button
          onClick={onToggleDark}
          className="ml-auto text-sm px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
          title="切换模式"
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
      </div>
      <input
        type="text"
        placeholder="搜索咖啡馆、品牌、地址..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="w-full px-3 py-1.5 md:py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent/60"
      />
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition border ${
              filter === f.key
                ? 'bg-accent text-coffee-950 border-accent'
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
