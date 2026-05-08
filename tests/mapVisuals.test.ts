import assert from 'node:assert/strict';
import type { CafeProperties } from '../src/types';
import { getCafeVisualStyle } from '../src/utils/mapVisuals';

const baseCafe: CafeProperties = {
  id: 'cafe-test',
  name: '测试咖啡',
  address: '北京市朝阳区测试路',
  lng: 116.4,
  lat: 39.9,
  dataSource: 'test',
  lastUpdated: '2026-05-08',
};

const star = getCafeVisualStyle({
  ...baseCafe,
  score: 94,
  scoreSpace: 91,
  scoreRarity: 88,
  scorePopularity: 86,
  brandCategory: 'independent',
  aiTags: ['适合办公', '拍照打卡', '新店活动'],
});

const quiet = getCafeVisualStyle({
  ...baseCafe,
  score: 48,
  scoreSpace: 40,
  scoreRarity: 35,
  scorePopularity: 38,
  brandCategory: 'chain',
  aiTags: [],
});

assert.equal(star.tier, 'legendary');
assert.equal(star.color, '#ffd166');
assert.ok(star.glowRadius > quiet.glowRadius);
assert.ok(star.emojis.includes('💻'));
assert.ok(star.emojis.includes('📸'));
assert.ok(star.emojis.includes('✨'));
assert.ok(star.hoverTitle.includes('测试咖啡'));
assert.ok(star.hoverDescription.includes('94'));
assert.equal(quiet.tier, 'low');
assert.ok(quiet.emojis.length >= 2);
