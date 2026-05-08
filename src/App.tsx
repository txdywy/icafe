import { useMapData } from './hooks/useMapData';
import MapView from './components/MapView';
import FilterBar from './components/FilterBar';
import DetailCard from './components/DetailCard';
import Leaderboard from './components/Leaderboard';

function App() {
  const {
    loading, error, filtered, filter, setFilter,
    search, setSearch, selected, selectCafe, darkMode, setDarkMode,
  } = useMapData();

  return (
    <div className="relative w-full h-full bg-coffee-950 text-white overflow-hidden">
      <MapView cafes={filtered} selectedId={selected?.properties.id ?? null} onSelect={selectCafe} />

      {/* Top-left controls */}
      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 max-w-[calc(100vw-1.5rem)]">
        <FilterBar
          filter={filter} onFilter={setFilter}
          search={search} onSearch={setSearch}
          darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)}
        />
      </div>

      {/* Right sidebar / bottom sheet on mobile */}
      <div className="absolute top-auto right-3 bottom-3 left-3 md:top-4 md:right-4 md:bottom-4 md:left-auto z-10 flex flex-col gap-3 items-stretch md:items-end pointer-events-none">
        {selected && (
          <DetailCard p={selected.properties} onClose={() => selectCafe(null)} />
        )}
        {!selected && (
          <Leaderboard
            cafes={filtered.slice(0, 50)}
            selectedId={null}
            onSelect={selectCafe}
          />
        )}
      </div>

      {/* Bottom-left stats */}
      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-10 pointer-events-auto hidden md:block">
        <div className="px-4 py-2 rounded-xl bg-panel border border-panel-border backdrop-blur text-xs text-white/60">
          {loading ? '加载数据中...' : error ? `错误: ${error}` : `显示 ${filtered.length} 家咖啡馆`}
        </div>
      </div>
    </div>
  );
}

export default App;
