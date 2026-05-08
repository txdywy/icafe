export interface CafeProperties {
  id: string;
  name: string;
  brand?: string;
  brandCategory?: 'chain' | 'independent' | 'hotel' | 'bookstore' | 'mall' | 'community' | 'other';
  address: string;
  district?: string;
  street?: string;
  lng: number;
  lat: number;
  phone?: string;
  businessHours?: string;
  rating?: number;
  reviewCount?: number;
  avgPrice?: number;
  photos?: string[];
  tags?: string[];
  aiTags?: string[];
  aiRecommend?: string;
  aiStyle?: string;
  aiCrowd?: string;
  dataSource: string;
  sourceId?: string;
  lastUpdated: string;

  // 评分维度
  score?: number;
  scoreAccessibility?: number;
  scoreRarity?: number;
  scorePopularity?: number;
  scoreBrand?: number;
  scoreSpace?: number;
  scoreAmenity?: number;
  scoreFreshness?: number;

  // 周边统计
  nearbyCafes500m?: number;
  nearbyCafes1km?: number;
  nearbyCafes2km?: number;
  nearbyMetro?: number;
  nearbyBus?: number;
  nearbyMall?: number;
  nearbyPark?: number;
  nearbyRestaurant?: number;
  nearbyOffice?: number;
}

export interface CafeFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: CafeProperties;
}

export interface CafeCollection {
  type: 'FeatureCollection';
  features: CafeFeature[];
  generatedAt: string;
  total: number;
  stats?: GlobalStats;
}

export interface GlobalStats {
  total: number;
  byDistrict: Record<string, number>;
  byBrand: Record<string, number>;
  byCategory: Record<string, number>;
  avgScore: number;
  topRated: string[];
  mostRare: string[];
  updatedAt: string;
}

export type FilterMode = 'all' | 'office' | 'photo' | 'metro' | 'independent' | 'chain' | 'rare' | 'new';
