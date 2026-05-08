/**
 * 数据清洗与去重合并
 * 输入: data/raw/pois-*.json
 * 输出: data/merged.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import brandConfig from '../config/brands.json';
import { inferDistrict, haversine } from '../src/utils/geo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface RawPoi {
  name: string;
  address: string;
  location: string;
  tel?: string;
  type?: string;
  photos?: string[];
  rating?: string;
  cost?: string;
  adname?: string;
  dataSource?: string;
}

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
  sourceIds: string[];
}

function parseLocation(loc: string): [number, number] | null {
  const parts = loc.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]];
  return null;
}

function detectBrand(name: string): { brand: string; category: string } | null {
  for (const [brandName, info] of Object.entries(brandConfig.chains)) {
    const aliases = [brandName, ...(info.aliases || [])];
    for (const alias of aliases) {
      if (name.includes(alias)) {
        return { brand: brandName, category: info.category };
      }
    }
  }
  return null;
}

function generateId(name: string, lng: number, lat: number): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `cafe-${hash}-${Math.round(lng * 1000)}-${Math.round(lat * 1000)}`;
}

function main() {
  const rawDir = path.resolve(__dirname, '../data/raw');
  const files = fs.readdirSync(rawDir).filter(f => f.startsWith('pois-') && f.endsWith('.json'));

  const allRaw: RawPoi[] = [];
  for (const f of files) {
    const content = JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf-8'));
    const source = f.includes('amap') ? 'amap' : f.includes('tencent') ? 'tencent' : f.includes('baidu') ? 'baidu' : 'unknown';
    for (const item of content) {
      allRaw.push({ ...item, dataSource: source });
    }
  }

  const cleanMap = new Map<string, CleanPoi>();

  for (const raw of allRaw) {
    const loc = parseLocation(raw.location);
    if (!loc) continue;
    const [lng, lat] = loc;
    const id = generateId(raw.name, lng, lat);
    const brandInfo = detectBrand(raw.name);
    const district = raw.adname || inferDistrict(raw.address);

    const existing = cleanMap.get(id);
    if (existing) {
      // 合并重复项，保留更完整的数据
      if (!existing.phone && raw.tel) existing.phone = raw.tel;
      if (!existing.rating && raw.rating) existing.rating = parseFloat(raw.rating);
      if (!existing.avgPrice && raw.cost) existing.avgPrice = parseFloat(raw.cost);
      if (raw.photos?.length) existing.photos = [...(existing.photos || []), ...raw.photos].slice(0, 5);
      if (!existing.sourceIds.includes(raw.dataSource || 'unknown')) {
        existing.sourceIds.push(raw.dataSource || 'unknown');
        existing.dataSource = existing.sourceIds.join('+');
      }
    } else {
      cleanMap.set(id, {
        id,
        name: raw.name,
        brand: brandInfo?.brand,
        brandCategory: brandInfo?.category,
        address: raw.address,
        district,
        lng,
        lat,
        phone: raw.tel,
        rating: raw.rating ? parseFloat(raw.rating) : undefined,
        avgPrice: raw.cost ? parseFloat(raw.cost) : undefined,
        photos: raw.photos?.slice(0, 5),
        tags: raw.type ? [raw.type] : [],
        dataSource: raw.dataSource || 'unknown',
        sourceIds: [raw.dataSource || 'unknown'],
      });
    }
  }

  // 地理去重：距离 < 50m 且名称相似，合并
  const cafes = Array.from(cleanMap.values());
  const merged: CleanPoi[] = [];
  const skip = new Set<number>();

  for (let i = 0; i < cafes.length; i++) {
    if (skip.has(i)) continue;
    const a = cafes[i];
    for (let j = i + 1; j < cafes.length; j++) {
      if (skip.has(j)) continue;
      const b = cafes[j];
      const d = haversine(a.lng, a.lat, b.lng, b.lat);
      if (d < 50 && (a.name.includes(b.name.slice(0, 3)) || b.name.includes(a.name.slice(0, 3)))) {
        // 合并 b 到 a
        if (!a.phone && b.phone) a.phone = b.phone;
        if (!a.rating && b.rating) a.rating = b.rating;
        skip.add(j);
      }
    }
    merged.push(a);
  }

  const outFile = path.resolve(__dirname, '../data/merged.json');
  fs.writeFileSync(outFile, JSON.stringify(merged, null, 2));
  console.log(`清洗合并完成: ${outFile}, 共 ${merged.length} 条 (原始 ${allRaw.length} 条)`);
}

main();
