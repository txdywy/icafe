# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` or `npm ci` — install dependencies (`npm ci` is used by CI).
- `npm run dev` — start the Vite development server.
- `npm run build` — run TypeScript project build (`tsc -b`) and create the Vite production build in `dist/`.
- `npm run lint` — run ESLint across the repo.
- `npm run preview` — preview the production build locally.
- `npm run fetch` — fetch raw coffee POI data from configured map APIs into `data/raw/`.
- `npm run clean` — clean and deduplicate raw POI files into `data/merged.json`.
- `npm run score` — compute score dimensions and export `data/cafes.geojson`, `data/cafes.json`, and `data/stats.json`.
- `npm run update:data` — run fetch, clean, and score in sequence.

There is currently no test script or test runner configured in `package.json`, so there is no single-test command yet. Use `npm run lint` and `npm run build` as the available automated checks.

## Architecture Overview

This is a Vite + React 19 + TypeScript dashboard for a Beijing coffee map. The app renders a full-screen MapLibre map with filter/search controls, a leaderboard, and a selected-cafe detail panel.

### Frontend flow

- `src/main.tsx` mounts the React app and imports global styles from `src/index.css`.
- `src/App.tsx` is the composition layer. It gets all data and UI state from `useMapData()` and wires `MapView`, `FilterBar`, `Leaderboard`, and `DetailCard` together.
- `src/hooks/useMapData.ts` fetches `/data/cafes.geojson` from the Vite public assets path, recomputes neighbor counts and scores, sorts cafes by score, and applies search/filter state.
- `src/types/index.ts` defines the shared GeoJSON-like cafe domain types used by both the browser app and Node data scripts.
- `src/utils/scoring.ts` contains the seven-dimension Coffee Index logic and neighbor-density calculation. It is shared by the export script and the browser hook.
- `src/utils/geo.ts` contains Haversine distance helpers and Beijing district inference used by the data pipeline.

### Map and UI

- `src/components/MapView.tsx` uses `maplibre-gl` directly, even though `react-map-gl` is installed.
- The map style is CARTO Dark Matter, loaded from `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`.
- Cafe points are loaded into a clustered MapLibre GeoJSON source named `cafes`; cluster, count, point, and label layers are created imperatively.
- Point color and radius are driven by `properties.score`; selecting a cafe recenters/zooms the map with `map.easeTo()`.
- Styling uses Tailwind CSS v4 via `@import "tailwindcss"` and an inline `@theme` block in `src/index.css` for coffee/accent/panel colors. The layout assumes `html`, `body`, and `#root` are full-screen with hidden overflow.
- UI copy and labels are primarily Chinese.

### Data pipeline

The data workflow is script-driven and separate from the browser runtime:

1. `scripts/fetch-poi.ts` reads `config/beijing-grid.json`, queries Amap/Tencent/Baidu POI APIs when `AMAP_KEY`, `TENCENT_MAP_KEY`, and `BAIDU_MAP_AK` are available, and writes timestamped raw files under `data/raw/`.
2. `scripts/clean-merge.ts` reads `data/raw/pois-*.json`, detects brands from `config/brands.json`, infers districts, deduplicates by generated ID and nearby/name similarity, and writes `data/merged.json`.
3. `scripts/score-export.ts` reads `data/merged.json` or falls back to `data/cafes.geojson`, computes neighbor counts and scores, then writes `data/cafes.geojson`, `data/cafes.json`, and `data/stats.json`.

The app loads `public/data/cafes.geojson` at runtime, while the scoring pipeline writes to `data/`. Keep these data copies synchronized when updating the dataset; otherwise the site can build successfully while serving stale public data.

### Build and deployment

- `vite.config.ts` uses the React and Tailwind Vite plugins, emits to `dist/`, enables sourcemaps, and sets `base` from `VITE_BASE_PATH` or `/`. Set `VITE_BASE_PATH` for GitHub Pages project-site deployments such as `/repo-name/`.
- `.github/workflows/update-data.yml` runs daily and manually on Node 22. It installs with `npm ci`, runs fetch/clean/score/build, commits `data/` updates back to the repo, uploads `dist`, and deploys to GitHub Pages.
- The fetch step in CI has `continue-on-error: true`, so clean/score/build may continue using existing data if external POI APIs fail.
