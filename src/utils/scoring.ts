import type { CafeFeature } from '../types';
import brandConfig from '../../config/brands.json';

const CATEGORY_WEIGHTS: Record<string, number> = brandConfig.categoryWeights;

interface ScoreConfig {
  wAccessibility: number;
  wRarity: number;
  wPopularity: number;
  wBrand: number;
  wSpace: number;
  wAmenity: number;
  wFreshness: number;
}

export const DEFAULT_CONFIG: ScoreConfig = {
  wAccessibility: 0.18,
  wRarity: 0.16,
  wPopularity: 0.15,
  wBrand: 0.12,
  wSpace: 0.15,
  wAmenity: 0.14,
  wFreshness: 0.10,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function sigmoid(x: number, k = 1, x0 = 0): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

/**
 * 计算单家咖啡馆的评分维度
 */
export function scoreCafe(
  cafe: CafeFeature,
  _allCafes: CafeFeature[],
  config: ScoreConfig = DEFAULT_CONFIG
): CafeFeature {
  const p = cafe.properties;

  // 1. 位置便利度：距离地铁/商圈/设施越近越好
  let accessibility = 0.5;
  if (p.nearbyMetro !== undefined) {
    accessibility = clamp01(1 - p.nearbyMetro / 2000);
  }
  if (p.nearbyBus !== undefined) {
    accessibility = accessibility * 0.6 + clamp01(1 - p.nearbyBus / 800) * 0.4;
  }
  if (p.nearbyMall !== undefined) {
    accessibility = accessibility * 0.7 + clamp01(1 - p.nearbyMall / 1000) * 0.3;
  }

  // 2. 稀缺性：周边咖啡馆密度越低越稀缺（但交通便利的稀缺更有价值）
  let rarity = 0.5;
  const nearby1k = p.nearbyCafes1km ?? 5;
  const densityScore = clamp01(1 - nearby1k / 20);
  rarity = densityScore * 0.5 + accessibility * 0.5;
  if ((p.nearbyCafes500m ?? 0) <= 1) rarity += 0.1;
  rarity = clamp01(rarity);

  // 3. 人气与口碑
  let popularity = 0.5;
  if (p.rating && p.reviewCount && p.reviewCount > 0) {
    popularity = clamp01((p.rating / 5) * 0.6 + sigmoid(p.reviewCount, 0.01, 50) * 0.4);
  } else if (p.rating) {
    popularity = p.rating / 5;
  } else {
    popularity = 0.45;
  }

  // 4. 品牌效应
  let brand = CATEGORY_WEIGHTS[p.brandCategory ?? 'other'] ?? 0.6;
  const brandEntry = Object.entries(brandConfig.chains).find(
    ([k]) => p.brand?.includes(k) || p.name?.includes(k)
  );
  if (brandEntry) {
    brand = brandEntry[1].weight;
  }

  // 5. 空间友好度：根据标签推断
  let space = 0.5;
  const tags = [...(p.tags ?? []), ...(p.aiTags ?? [])].join(' ');
  if (tags.includes('办公') || tags.includes('安静') || tags.includes('WiFi') || tags.includes('插座')) {
    space += 0.2;
  }
  if (tags.includes('拍照') || tags.includes('打卡') || tags.includes('设计')) {
    space += 0.1;
  }
  if (tags.includes('宠物')) space += 0.05;
  space = clamp01(space);

  // 6. 周边便利度
  let amenity = 0.5;
  const nearbyCount =
    (p.nearbyRestaurant ?? 0) + (p.nearbyPark ?? 0) + (p.nearbyMall ?? 0) + (p.nearbyOffice ?? 0);
  amenity = clamp01(0.3 + nearbyCount / 30);

  // 7. 活动与新鲜度
  let freshness = 0.5;
  if (p.aiTags?.some(t => t.includes('新') || t.includes('活动') || t.includes('联名'))) {
    freshness += 0.2;
  }
  const daysSinceUpdate = (Date.now() - new Date(p.lastUpdated).getTime()) / 86400000;
  freshness = clamp01(freshness - daysSinceUpdate / 365 * 0.2);

  const total =
    accessibility * config.wAccessibility +
    rarity * config.wRarity +
    popularity * config.wPopularity +
    brand * config.wBrand +
    space * config.wSpace +
    amenity * config.wAmenity +
    freshness * config.wFreshness;

  p.scoreAccessibility = Math.round(accessibility * 100);
  p.scoreRarity = Math.round(rarity * 100);
  p.scorePopularity = Math.round(popularity * 100);
  p.scoreBrand = Math.round(brand * 100);
  p.scoreSpace = Math.round(space * 100);
  p.scoreAmenity = Math.round(amenity * 100);
  p.scoreFreshness = Math.round(freshness * 100);
  p.score = Math.round(total * 100);

  return cafe;
}

/**
 * 为所有咖啡馆计算周边密度统计
 */
export function computeNeighbors(cafes: CafeFeature[]): CafeFeature[] {
  for (const cafe of cafes) {
    const p = cafe.properties;
    let c500 = 0, c1k = 0, c2k = 0;
    for (const other of cafes) {
      if (other === cafe) continue;
      const d = haversine(p.lng, p.lat, other.properties.lng, other.properties.lat);
      if (d < 500) c500++;
      if (d < 1000) c1k++;
      if (d < 2000) c2k++;
    }
    p.nearbyCafes500m = c500;
    p.nearbyCafes1km = c1k;
    p.nearbyCafes2km = c2k;
  }
  return cafes;
}

import { haversine } from './geo';
