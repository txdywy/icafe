# ☕ 北京咖啡地图 | Beijing Coffee Index

基于公开地图 API 与 AI 构建的城市咖啡情报仪表盘。可视化展示北京市咖啡馆 POI 分布，并生成可解释的「咖啡生活指数」。

🔗 **在线预览**: [GitHub Pages 部署地址]

## 项目特性

- 🗺️ **地图可视化**: MapLibre GL JS + CARTO 暗色底图，支持点位聚合、热力图、行政区筛选
- 📊 **咖啡指数**: 7 维度透明评分模型（便利度、稀缺性、人气、品牌、空间、周边、新鲜度）
- 🔍 **多维筛选**: 适合办公 / 适合拍照 / 地铁方便 / 独立咖啡 / 连锁品牌 / 高稀缺区 / 新店活动
- 🏆 **榜单视图**: 综合评分排序，地图与列表联动
- 🤖 **AI 增强**: 自动推断标签、推荐理由、空间风格、适合人群（基于 OpenRouter，仅对新增/变化 POI 调用）
- ⏰ **自动更新**: GitHub Actions 每天定时抓取 → 清洗 → 评分 → 部署
- 📱 **移动端适配**: 响应式布局，底部榜单 + 顶部筛选

## 技术栈

- **前端**: Vite + React 19 + TypeScript + Tailwind CSS
- **地图**: MapLibre GL JS (react-map-gl)
- **数据**: GeoJSON FeatureCollection
- **CI/CD**: GitHub Actions + GitHub Pages

## 评分模型

每家咖啡馆的 Coffee Index（0-100）由以下维度加权计算：

| 维度 | 权重 | 说明 |
|------|------|------|
| 位置便利度 | 18% | 距离地铁、公交、商圈的接近程度 |
| 稀缺性 | 16% | 周边 1km 内咖啡馆密度，密度低且交通便利则稀缺性高 |
| 人气口碑 | 15% | 评分、评论数、人均价格，无数据则用品牌/位置弱指标估算 |
| 品牌效应 | 12% | 连锁 vs 独立 vs 书店/酒店/商场配套 |
| 空间友好度 | 15% | 是否适合办公、拍照、社交、安静阅读（基于名称/标签推断）|
| 周边便利度 | 14% | 餐饮、书店、公园、商场、办公区密度 |
| 活动新鲜度 | 10% | 促销、联名、新店等活动标记 |

评分配置位于 `src/utils/scoring.ts`，可自由调参。

## 数据源与抓取策略

### 支持的 API

- **高德地图 Web 服务 API**: 多边形搜索 `place/polygon`
- **腾讯位置服务 WebService API**: 矩形区域搜索
- **百度地图地点检索 API**: 矩形 bounds 搜索

### 抓取方式

将北京划分为网格（默认 0.05° ≈ 5km），对每格使用多组关键词分页抓取：

```
咖啡 / 咖啡馆 / 咖啡店 / coffee / 星巴克 / 瑞幸 / Manner / Peet's / ...
```

### 去重策略

1. **ID 去重**: 相同名称 + 经纬度哈希生成唯一 ID
2. **地理去重**: 距离 < 50m 且名称相似的 POI 合并
3. **字段合并**: 保留更完整的数据（评分、电话、图片等）

## 项目结构

```
├── .github/workflows/update-data.yml   # 定时更新工作流
├── config/
│   ├── brands.json                     # 品牌字典与分类权重
│   └── beijing-grid.json               # 北京网格与行政区配置
├── data/
│   ├── cafes.geojson                   # 主数据（GeoJSON）
│   ├── cafes.json                      # 扁平属性数据
│   ├── stats.json                      # 全局统计
│   └── raw/                            # 原始抓取数据
├── public/
│   └── data/cafes.geojson              # 构建时复制到 dist
├── scripts/
│   ├── fetch-poi.ts                    # 多源 API 抓取
│   ├── clean-merge.ts                  # 清洗去重合并
│   └── score-export.ts                 # 评分计算与导出
├── src/
│   ├── components/                     # 地图、筛选、详情、榜单、雷达图
│   ├── hooks/useMapData.ts             # 数据加载与状态管理
│   ├── types/index.ts                  # TypeScript 类型定义
│   ├── utils/
│   │   ├── geo.ts                      # 地理计算工具
│   │   └── scoring.ts                  # 评分模型
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## 本地开发

```bash
# 1. 克隆仓库
git clone <repo> && cd beijing-coffee-map

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build
```

## 配置 API Key

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `AMAP_KEY` | 高德地图 Web 服务 Key |
| `TENCENT_MAP_KEY` | 腾讯位置服务 Key |
| `BAIDU_MAP_AK` | 百度地图服务端 AK |
| `OPENROUTER_API_KEY` | （可选）OpenRouter API Key，用于 AI 标签生成 |

## 手动更新数据

```bash
# 抓取原始 POI
npm run fetch

# 清洗合并
npm run clean

# 评分导出
npm run score

# 一键执行
npm run update:data
```

## 合规声明

- 数据优先来源于官方开放 API，不违规爬取限制性网站
- 保留每条 POI 的 `dataSource` 字段
- 图片仅保存链接，不本地存储
- 地图底图使用 CARTO / OpenStreetMap 合规方案

## License

MIT
