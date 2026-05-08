import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CafeFeature } from '../types';
import { getCafeVisualStyle } from '../utils/mapVisuals';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

type CafeVisualProperties = CafeFeature['properties'] & {
  visualColor: string;
  haloColor: string;
  glowRadius: number;
  pointRadius: number;
  emojiText: string;
  hoverTitle: string;
  hoverDescription: string;
  photo?: string;
};

function buildCafeFeature(cafe: CafeFeature): GeoJSON.Feature<GeoJSON.Point, CafeVisualProperties> {
  const visual = getCafeVisualStyle(cafe.properties);
  return {
    type: 'Feature',
    geometry: cafe.geometry,
    properties: {
      ...cafe.properties,
      visualColor: visual.color,
      haloColor: visual.haloColor,
      glowRadius: visual.glowRadius,
      pointRadius: visual.pointRadius,
      emojiText: visual.emojis.join(' '),
      hoverTitle: visual.hoverTitle,
      hoverDescription: visual.hoverDescription,
      photo: cafe.properties.photos?.[0],
    },
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char] ?? char));
}

function createPopupHtml(properties: { hoverTitle?: string; hoverDescription?: string; photo?: string; emojiText?: string; emoji?: string; visualColor?: string }) {
  const title = escapeHtml(properties.hoverTitle ?? 'Coffee Signal');
  const description = escapeHtml(properties.hoverDescription ?? '');
  const marker = escapeHtml(properties.emoji ?? properties.emojiText ?? '☕');
  const color = escapeHtml(properties.visualColor ?? '#ffd166');
  const photo = properties.photo
    ? `<img class="coffee-orbit-popup__image" src="${escapeHtml(properties.photo)}" alt="${title}" />`
    : '<div class="coffee-orbit-popup__image coffee-orbit-popup__image--empty">☕</div>';

  return `
    <div class="coffee-orbit-popup" style="--signal-color:${color}">
      ${photo}
      <div class="coffee-orbit-popup__body">
        <div class="coffee-orbit-popup__eyebrow">${marker} 咖啡情报信号</div>
        <div class="coffee-orbit-popup__title">${title}</div>
        <div class="coffee-orbit-popup__text">${description}</div>
      </div>
    </div>
  `;
}

export default function MapView({
  cafes, selectedId, onSelect,
}: {
  cafes: CafeFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const emojiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [116.4074, 39.9042],
      zoom: 11,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.on('load', () => setLoaded(true));
    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      emojiMarkersRef.current.forEach(marker => marker.remove());
      emojiMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const sourceId = 'cafes';
    const layerId = 'cafes-layer';
    const glowLayerId = 'cafes-glow';
    const haloLayerId = 'cafes-halo';
    const labelId = 'cafes-label';

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, CafeVisualProperties> = {
      type: 'FeatureCollection',
      features: cafes.map(buildCafeFeature),
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojson, cluster: true, clusterRadius: 40, clusterMaxZoom: 14 });
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#60a5fa', 10, '#4ade80', 50, '#e8a649'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-font': ['Open Sans Bold'],
        },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: glowLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'haloColor'],
          'circle-radius': ['interpolate', ['linear'], ['get', 'score'], 0, 20, 60, 38, 100, 62],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.2, 15, 0.36],
          'circle-blur': 0.72,
        },
      });
      map.addLayer({
        id: haloLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ['interpolate', ['linear'], ['get', 'score'], 0, 11, 60, 18, 100, 27],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1.4, 15, 3.4],
          'circle-stroke-color': ['get', 'visualColor'],
          'circle-stroke-opacity': 0.76,
        },
      });
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'visualColor'],
          'circle-radius': ['interpolate', ['linear'], ['get', 'score'], 0, 7, 60, 12, 100, 18],
          'circle-opacity': 0.96,
          'circle-stroke-width': ['interpolate', ['linear'], ['get', 'score'], 0, 1.5, 100, 4],
          'circle-stroke-color': '#fff7d6',
          'circle-stroke-opacity': 0.95,
        },
      });
      map.addLayer({
        id: labelId,
        type: 'symbol',
        source: sourceId,
        minzoom: 12,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['format', ['get', 'emojiText'], { 'font-scale': 1.1 }, '\n', {}, ['get', 'name'], { 'font-scale': 0.82 }],
          'text-size': 12,
          'text-offset': [0, 1.45],
          'text-anchor': 'top',
          'text-font': ['Open Sans Bold'],
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#fff8e6',
          'text-halo-color': 'rgba(8,5,3,0.9)',
          'text-halo-width': 2.6,
        },
      });

      const showPopup = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        const point = (f?.geometry as GeoJSON.Point | undefined)?.coordinates as [number, number] | undefined;
        if (!f?.properties || !point) return;
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 24, className: 'coffee-orbit-popup-shell' })
          .setLngLat(point)
          .setHTML(createPopupHtml(f.properties))
          .addTo(map);
      };
      const hidePopup = () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
        popupRef.current = null;
      };

      map.on('click', layerId, (e) => {
        const f = e.features?.[0];
        if (f?.properties?.id) onSelect(f.properties.id);
      });
      map.on('mouseenter', layerId, (e) => { map.getCanvas().style.cursor = 'pointer'; showPopup(e); });
      map.on('mousemove', layerId, showPopup);
      map.on('mouseleave', layerId, hidePopup);
      map.on('click', 'clusters', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id;
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then(zoom => {
          const center = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center, zoom });
        });
      });
    }

    // Re-set data to trigger update
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);

    emojiMarkersRef.current.forEach(marker => marker.remove());
    emojiMarkersRef.current = cafes.slice(0, 120).flatMap((cafe) => {
      const visual = getCafeVisualStyle(cafe.properties);
      const [lng, lat] = cafe.geometry.coordinates;
      return visual.emojis.slice(0, 3).map((emoji, index) => {
        const el = document.createElement('button');
        el.className = 'cafe-emoji-orbit';
        el.type = 'button';
        el.textContent = emoji;
        el.style.setProperty('--signal-color', visual.color);
        el.setAttribute('aria-label', `${cafe.properties.name} ${emoji}`);
        el.addEventListener('mouseenter', () => {
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 20, className: 'coffee-orbit-popup-shell' })
            .setLngLat([lng, lat])
            .setHTML(createPopupHtml({ ...visual, photo: cafe.properties.photos?.[0], emoji }))
            .addTo(map);
        });
        el.addEventListener('mouseleave', () => {
          popupRef.current?.remove();
          popupRef.current = null;
        });
        const marker = new maplibregl.Marker({ element: el, offset: [(index - 1) * 23, -34 - Math.abs(index - 1) * 8] })
          .setLngLat([lng, lat])
          .addTo(map);
        return marker;
      });
    });

    // Highlight selected
    if (selectedId) {
      const target = cafes.find(c => c.properties.id === selectedId);
      if (target) {
        map.easeTo({
          center: target.geometry.coordinates as [number, number],
          zoom: Math.max(map.getZoom(), 15),
          duration: 800,
        });
      }
    }
  }, [cafes, loaded, selectedId, onSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-coffee-950">
          <div className="text-accent text-lg font-medium animate-pulse">正在加载地图...</div>
        </div>
      )}
    </div>
  );
}
