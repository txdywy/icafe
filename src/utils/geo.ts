/**
 * Haversine 距离计算 (单位：米)
 */
export function haversine(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 生成北京网格搜索区域列表
 */
export function generateBeijingGrids(
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
  step: number
): Array<{ name: string; polygon: string }> {
  const grids: Array<{ name: string; polygon: string }> = [];
  let idx = 0;
  for (let lng = minLng; lng < maxLng; lng += step) {
    for (let lat = minLat; lat < maxLat; lat += step) {
      const p1 = `${lng},${lat}`;
      const p2 = `${lng + step},${lat}`;
      const p3 = `${lng + step},${lat + step}`;
      const p4 = `${lng},${lat + step}`;
      grids.push({
        name: `grid_${idx++}`,
        polygon: `${p1}|${p2}|${p3}|${p4}`,
      });
    }
  }
  return grids;
}

const DISTRICT_KEYWORDS: Record<string, string[]> = {
  '东城区': ['东城', '王府井', '东单', '崇文', '前门', '雍和宫', '南锣鼓巷', '灯市口', '东四', '朝阳门内'],
  '西城区': ['西城', '西单', '金融街', '宣武', '德胜门', '什刹海', '新街口', '西四', '阜成门', '广安门'],
  '朝阳区': ['朝阳', '国贸', '三里屯', '望京', '大望路', 'CBD', '亚运村', '劲松', '双井', '潘家园', '团结湖', '朝阳公园', '酒仙桥', '大屯', '呼家楼', '朝外'],
  '丰台区': ['丰台', '丽泽', '方庄', '宋家庄', '马家堡', '西罗园', '大红门', '新发地', '玉泉营', '草桥', '角门', '太平桥'],
  '石景山区': ['石景山', '八角', '古城', '苹果园', '鲁谷', '老山', '五里坨'],
  '海淀区': ['海淀', '中关村', '五道口', '西二旗', '上地', '知春路', '学院路', '魏公村', '紫竹桥', '公主坟', '万寿路', '清河', '马连洼', '西北旺'],
  '门头沟区': ['门头沟', '大峪', '永定', '龙泉'],
  '房山区': ['房山', '良乡', '拱辰', '长阳', '阎村', '窦店', '城关', '琉璃河', '周口店'],
  '通州区': ['通州', '梨园', '九棵树', '北苑', '新华', '中仓', '玉桥', '永顺', '潞城', '台湖', '马驹桥'],
  '顺义区': ['顺义', '天竺', '后沙峪', '仁和', '石园', '空港', '杨镇'],
  '昌平区': ['昌平', '回龙观', '天通苑', '沙河', '南口', '城北', '城南'],
  '大兴区': ['大兴', '黄村', '西红门', '亦庄', '旧宫', '瀛海', '青云店', '庞各庄', '榆垡'],
  '怀柔区': ['怀柔', '龙山', '泉河', '庙城'],
  '平谷区': ['平谷', '兴谷', '滨河'],
  '密云区': ['密云', '鼓楼', '果园'],
  '延庆区': ['延庆', '儒林', '百泉'],
};

/**
 * 根据名称和地址推断行政区
 */
export function inferDistrict(address: string): string | undefined {
  for (const [district, keywords] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const kw of keywords) {
      if (address.includes(kw)) return district;
    }
  }
  return undefined;
}
