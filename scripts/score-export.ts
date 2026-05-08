/**
 * 评分计算与导出
 * 输入: data/merged.json
 * 输出: data/cafes.geojson, data/cafes.json, data/stats.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CafeFeature, CafeCollection, GlobalStats } from '../src/types';
import { computeNeighbors, scoreCafe } from '../src/utils/scoring';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CleanPoi {
  id: string;
  name: string;
  brand?: string;
  brandCategory?: string;
  address: string;
  district?: string;
  lng: number;
  lat: number;
  phone?: string;
  rating?: number;
  avgPrice?: number;
  photos?: string[];
  tags?: string[];
  dataSource: string;
}

function main() {
  const mergedFile = path.resolve(__dirname, '../data/merged.json');
  const geojsonFile = path.resolve(__dirname, '../data/cafes.geojson');

  let features: CafeFeature[];

  if (fs.existsSync(mergedFile)) {
    const pois: CleanPoi[] = JSON.parse(fs.readFileSync(mergedFile, 'utf-8'));
    features = pois.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        brandCategory: p.brandCategory as CafeFeature['properties']['brandCategory'],
        address: p.address,
        district: p.district,
        lng: p.lng,
        lat: p.lat,
        phone: p.phone,
        rating: p.rating,
        avgPrice: p.avgPrice,
        photos: p.photos,
        tags: p.tags,
        dataSource: p.dataSource,
        lastUpdated: new Date().toISOString().slice(0, 10),
      },
    }));
  } else if (fs.existsSync(geojsonFile)) {
    const collection: CafeCollection = JSON.parse(fs.readFileSync(geojsonFile, 'utf-8'));
    features = collection.features;
  } else {
    console.error('未找到 merged.json 或 cafes.geojson');
    process.exit(1);
  }

  features = computeNeighbors(features);
  features = features.map(f => scoreCafe(f, features));
  features.sort((a, b) => (b.properties.score ?? 0) - (a.properties.score ?? 0));

  const collection: CafeCollection = {
    type: 'FeatureCollection',
    features,
    generatedAt: new Date().toISOString(),
    total: features.length,
  };

  const byDistrict: Record<string, number> = {};
  const byBrand: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let totalScore = 0;

  for (const f of features) {
    const p = f.properties;
    byDistrict[p.district || '未知'] = (byDistrict[p.district || '未知'] || 0) + 1;
    byBrand[p.brand || '其他'] = (byBrand[p.brand || '其他'] || 0) + 1;
    byCategory[p.brandCategory || 'other'] = (byCategory[p.brandCategory || 'other'] || 0) + 1;
    totalScore += p.score ?? 0;
  }

  const stats: GlobalStats = {
    total: features.length,
    byDistrict,
    byBrand,
    byCategory,
    avgScore: features.length ? Math.round(totalScore / features.length) : 0,
    topRated: features.slice(0, 10).map(f => f.properties.id),
    mostRare: features.filter(f => (f.properties.nearbyCafes1km ?? 10) <= 2).slice(0, 10).map(f => f.properties.id),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../data/cafes.geojson'),
    JSON.stringify(collection, null, 2)
  );
  fs.writeFileSync(
    path.resolve(__dirname, '../data/cafes.json'),
    JSON.stringify(features.map(f => f.properties), null, 2)
  );
  fs.writeFileSync(
    path.resolve(__dirname, '../data/stats.json'),
    JSON.stringify(stats, null, 2)
  );

  console.log(`导出完成: ${features.length} 家咖啡馆`);
  console.log(`平均分: ${stats.avgScore}`);
  console.log(`行政区分布:`, byDistrict);
}

main();
