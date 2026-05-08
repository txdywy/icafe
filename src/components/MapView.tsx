import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CafeFeature } from '../types';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function MapView({
  cafes, selectedId, onSelect,
}: {
  cafes: CafeFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
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
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const sourceId = 'cafes';
    const layerId = 'cafes-layer';
    const labelId = 'cafes-label';

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: cafes.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: f.properties,
      })),
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
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'step',
            ['get', 'score'],
            '#a78bfa', 55,
            '#60a5fa', 70,
            '#4ade80', 85,
            '#e8a649'
          ],
          'circle-radius': [
            'step',
            ['get', 'score'],
            8, 55,
            10, 70,
            14, 85,
            18
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: labelId,
        type: 'symbol',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '{name}',
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-font': ['Open Sans Regular'],
        },
        paint: {
          'text-color': '#f0f0f0',
          'text-halo-color': 'rgba(0,0,0,0.7)',
          'text-halo-width': 2,
        },
      });

      map.on('click', layerId, (e) => {
        const f = e.features?.[0];
        if (f?.properties?.id) onSelect(f.properties.id);
      });
      map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
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
