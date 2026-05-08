import type { CafeProperties } from '../types';

export type CafeVisualTier = 'low' | 'mid' | 'high' | 'legendary';

export interface CafeVisualStyle {
  tier: CafeVisualTier;
  color: string;
  haloColor: string;
  glowRadius: number;
  pointRadius: number;
  emojis: string[];
  hoverTitle: string;
  hoverDescription: string;
}

function getTier(score: number): CafeVisualTier {
  if (score >= 88) return 'legendary';
  if (score >= 74) return 'high';
  if (score >= 58) return 'mid';
  return 'low';
}

function getScoreColors(tier: CafeVisualTier): Pick<CafeVisualStyle, 'color' | 'haloColor'> {
  switch (tier) {
    case 'legendary':
      return { color: '#ffd166', haloColor: '#ff7a1a' };
    case 'high':
      return { color: '#4ade80', haloColor: '#22d3ee' };
    case 'mid':
      return { color: '#60a5fa', haloColor: '#a78bfa' };
    case 'low':
      return { color: '#a78bfa', haloColor: '#64748b' };
  }
}

function uniqueEmojis(emojis: string[]): string[] {
  return Array.from(new Set(emojis)).slice(0, 4);
}

function getFeatureEmojis(cafe: CafeProperties): string[] {
  const tags = [...(cafe.tags ?? []), ...(cafe.aiTags ?? [])].join(' ');
  const emojis: string[] = [];

  if (tags.includes('办公') || tags.includes('安静') || tags.includes('WiFi') || (cafe.scoreSpace ?? 0) >= 80) emojis.push('💻');
  if (tags.includes('拍照') || tags.includes('打卡') || tags.includes('设计')) emojis.push('📸');
  if (tags.includes('新') || tags.includes('活动') || tags.includes('联名')) emojis.push('✨');
  if (tags.includes('宠物')) emojis.push('🐾');
  if ((cafe.scoreRarity ?? 0) >= 80) emojis.push('🧭');
  if ((cafe.scorePopularity ?? 0) >= 80 || (cafe.rating ?? 0) >= 4.5) emojis.push('🔥');
  if (cafe.brandCategory === 'independent' || cafe.brandCategory === 'bookstore') emojis.push('☕');
  if (cafe.brandCategory === 'chain') emojis.push('⚡');

  return uniqueEmojis(emojis.length >= 2 ? emojis : [...emojis, '☕', '📍']);
}

export function getCafeVisualStyle(cafe: CafeProperties): CafeVisualStyle {
  const score = cafe.score ?? 0;
  const tier = getTier(score);
  const colors = getScoreColors(tier);

  return {
    tier,
    ...colors,
    glowRadius: Math.round(18 + score * 0.42),
    pointRadius: Math.round(7 + score * 0.11),
    emojis: getFeatureEmojis(cafe),
    hoverTitle: `${cafe.name} · Coffee Signal`,
    hoverDescription: `${score || '未知'} 分｜${cafe.district ?? '北京'}｜${cafe.aiRecommend ?? cafe.address}`,
  };
}
