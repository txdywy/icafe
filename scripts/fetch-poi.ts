/**
 * POI 抓取脚本
 * 支持高德、腾讯、百度地图 API 多源抓取
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gridConfig from '../config/beijing-grid.json';

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
}

interface AmapPoi {
  name: string;
  address?: string;
  location: string;
  tel?: string;
  type?: string;
  photos?: Array<{ url: string }>;
  biz_ext?: {
    rating?: string;
    cost?: string;
  };
  adname?: string;
}

interface AmapResponse {
  status: string;
  pois?: AmapPoi[];
}

interface TencentPoi {
  title: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
  tel?: string;
  category?: string;
  rating?: string | number;
}

interface TencentResponse {
  status: number;
  data?: TencentPoi[];
}

interface BaiduPoi {
  name: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
  telephone?: string;
  detail_info?: {
    type?: string;
    overall_rating?: string | number;
    price?: string | number;
  };
}

interface BaiduResponse {
  status: number;
  results?: BaiduPoi[];
}

const AMAP_KEY = process.env.AMAP_KEY || '';
const TENCENT_KEY = process.env.TENCENT_MAP_KEY || '';
const BAIDU_AK = process.env.BAIDU_MAP_AK || '';

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function isInBeijing(address: string, adname?: string): boolean {
  const beijingDistricts = new Set(gridConfig.districts);
  if (adname && beijingDistricts.has(adname)) return true;
  const exclude = ['河北', '天津', '廊坊', '保定', '张家口', '承德', '唐山', '秦皇岛', '沧州', '衡水', '邢台', '邯郸', '涞水', '涿州', '固安'];
  for (const ex of exclude) {
    if (address.includes(ex)) return false;
  }
  return true;
}

async function fetchAmapAll(keyword: string, polygon: string): Promise<RawPoi[]> {
  if (!AMAP_KEY) return [];
  const url = 'https://restapi.amap.com/v3/place/polygon';
  const all: RawPoi[] = [];
  let page = 1;
  const offset = 25;

  while (page <= 20) {
    try {
      const { data } = await axios.get<AmapResponse>(url, {
        params: { key: AMAP_KEY, polygon, keywords: keyword, offset, page, extensions: 'all' },
        timeout: 15000,
      });
      if (data.status !== '1' || !data.pois || data.pois.length === 0) break;

      const pois = data.pois.map((p): RawPoi => ({
        name: p.name,
        address: p.address || p.adname || '',
        location: p.location,
        tel: p.tel,
        type: p.type,
        photos: p.photos?.map(ph => ph.url) ?? [],
        rating: p.biz_ext?.rating,
        cost: p.biz_ext?.cost,
        adname: p.adname,
      })).filter((p) => isInBeijing(p.address, p.adname));

      all.push(...pois);
      if (data.pois.length < offset) break;
      page++;
      await sleep(150);
    } catch (e) {
      console.warn(`[高德] ${keyword} page ${page} 失败`, (e as Error).message);
      break;
    }
  }
  return all;
}

async function fetchTencentAll(keyword: string, boundary: string): Promise<RawPoi[]> {
  if (!TENCENT_KEY) return [];
  const url = 'https://apis.map.qq.com/ws/place/v1/search';
  const all: RawPoi[] = [];
  let page = 1;
  const page_size = 20;

  while (page <= 25) {
    try {
      const { data } = await axios.get<TencentResponse>(url, {
        params: { key: TENCENT_KEY, keyword, boundary, page_index: page - 1, page_size },
        timeout: 15000,
      });
      if (data.status !== 0 || !data.data || data.data.length === 0) break;
      const pois = data.data.map((p): RawPoi => ({
        name: p.title,
        address: p.address,
        location: `${p.location.lng},${p.location.lat}`,
        tel: p.tel,
        type: p.category,
        rating: p.rating?.toString(),
      })).filter((p) => isInBeijing(p.address));
      all.push(...pois);
      if (data.data.length < page_size) break;
      page++;
      await sleep(150);
    } catch (e) {
      console.warn(`[腾讯] ${keyword} page ${page} 失败`, (e as Error).message);
      break;
    }
  }
  return all;
}

async function fetchBaiduAll(keyword: string, bounds: string): Promise<RawPoi[]> {
  if (!BAIDU_AK) return [];
  const url = 'https://api.map.baidu.com/place/v2/search';
  const all: RawPoi[] = [];
  let page = 1;
  const page_size = 20;

  while (page <= 25) {
    try {
      const { data } = await axios.get<BaiduResponse>(url, {
        params: { ak: BAIDU_AK, query: keyword, bounds, page_num: page - 1, page_size, output: 'json', scope: 2 },
        timeout: 15000,
      });
      if (data.status !== 0 || !data.results || data.results.length === 0) break;
      const pois = data.results.map((p): RawPoi => ({
        name: p.name,
        address: p.address,
        location: `${p.location.lng},${p.location.lat}`,
        tel: p.telephone,
        type: p.detail_info?.type,
        rating: p.detail_info?.overall_rating?.toString(),
        cost: p.detail_info?.price?.toString(),
      })).filter((p) => isInBeijing(p.address));
      all.push(...pois);
      if (data.results.length < page_size) break;
      page++;
      await sleep(150);
    } catch (e) {
      console.warn(`[百度] ${keyword} page ${page} 失败`, (e as Error).message);
      break;
    }
  }
  return all;
}

function gridDistanceToCenter(lng: number, lat: number): number {
  const [cx, cy] = gridConfig.center;
  return (lng - cx) ** 2 + (lat - cy) ** 2;
}

async function fetchAll(): Promise<RawPoi[]> {
  const all: RawPoi[] = [];
  const keywords = gridConfig.keywords;
  const { minLng, maxLng, minLat, maxLat } = gridConfig.bounds;
  const step = gridConfig.gridSize;

  const grids: Array<{ polygon: string; bounds: string; boundary: string; name: string; dist: number }> = [];
  for (let lng = minLng; lng < maxLng; lng += step) {
    for (let lat = minLat; lat < maxLat; lat += step) {
      const polygon = `${lng},${lat};${lng + step},${lat + step}`;
      const bounds = `${lat},${lng},${lat + step},${lng + step}`;
      const boundary = `rectangle(${lat},${lng},${lat + step},${lng + step})`;
      grids.push({ polygon, bounds, boundary, name: `${lng.toFixed(2)},${lat.toFixed(2)}`, dist: gridDistanceToCenter(lng + step / 2, lat + step / 2) });
    }
  }

  // 按距离市中心排序，优先抓取核心区域
  grids.sort((a, b) => a.dist - b.dist);

  console.log(`准备抓取 ${grids.length} 个网格 × ${keywords.length} 个关键词`);

  // 开发/测试阶段抓前 60 个网格（覆盖核心城区）
  const testGrids = grids.slice(0, 60);

  for (const grid of testGrids) {
    for (const kw of keywords) {
      const amap = await fetchAmapAll(kw, grid.polygon);
      if (amap.length) {
        all.push(...amap.map(p => ({ ...p, dataSource: 'amap' as string })));
        if (amap.length > 5) console.log(`[高德] ${grid.name} ${kw} → ${amap.length} 条`);
      }
      const tx = await fetchTencentAll(kw, grid.boundary);
      if (tx.length) {
        all.push(...tx.map(p => ({ ...p, dataSource: 'tencent' as string })));
        if (tx.length > 5) console.log(`[腾讯] ${grid.name} ${kw} → ${tx.length} 条`);
      }
      const bd = await fetchBaiduAll(kw, grid.bounds);
      if (bd.length) {
        all.push(...bd.map(p => ({ ...p, dataSource: 'baidu' as string })));
        if (bd.length > 5) console.log(`[百度] ${grid.name} ${kw} → ${bd.length} 条`);
      }
    }
  }

  return all;
}

async function main() {
  const rawDir = path.resolve(__dirname, '../data/raw');
  fs.mkdirSync(rawDir, { recursive: true });

  const pois = await fetchAll();
  const outFile = path.join(rawDir, `pois-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(pois, null, 2));
  console.log(`\n原始 POI 已保存: ${outFile}`);
  console.log(`共 ${pois.length} 条`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
