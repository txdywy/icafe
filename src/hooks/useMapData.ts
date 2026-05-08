import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CafeCollection, FilterMode } from '../types';
import { computeNeighbors, scoreCafe } from '../utils/scoring';

export function useMapData() {
  const [data, setData] = useState<CafeCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    fetch('/data/cafes.geojson')
      .then(r => r.json())
      .then((raw: CafeCollection) => {
        let cafes = raw.features;
        cafes = computeNeighbors(cafes);
        cafes = cafes.map(c => scoreCafe(c, cafes));
        cafes.sort((a, b) => (b.properties.score ?? 0) - (a.properties.score ?? 0));
        setData({ ...raw, features: cafes, total: cafes.length });
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.features;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.properties.name.toLowerCase().includes(q) ||
        f.properties.address.toLowerCase().includes(q) ||
        f.properties.brand?.toLowerCase().includes(q) ||
        f.properties.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    switch (filter) {
      case 'office':
        list = list.filter(f => f.properties.aiTags?.some(t => t.includes('办公') || t.includes('安静')));
        break;
      case 'photo':
        list = list.filter(f => f.properties.aiTags?.some(t => t.includes('拍照') || t.includes('打卡')));
        break;
      case 'metro':
        list = list.filter(f => (f.properties.nearbyMetro ?? 9999) < 800);
        break;
      case 'independent':
        list = list.filter(f => f.properties.brandCategory === 'independent' || f.properties.brandCategory === 'bookstore');
        break;
      case 'chain':
        list = list.filter(f => f.properties.brandCategory === 'chain');
        break;
      case 'rare':
        list = list.filter(f => (f.properties.nearbyCafes1km ?? 10) <= 3);
        break;
      case 'new':
        list = list.filter(f => f.properties.aiTags?.some(t => t.includes('新') || t.includes('活动')));
        break;
    }
    return list;
  }, [data, filter, search]);

  const selected = useMemo(() =>
    data?.features.find(f => f.properties.id === selectedId) ?? null
  , [data, selectedId]);

  const selectCafe = useCallback((id: string | null) => setSelectedId(id), []);

  return {
    data, loading, error,
    filtered, filter, setFilter,
    search, setSearch,
    selected, selectCafe,
    darkMode, setDarkMode,
  };
}
