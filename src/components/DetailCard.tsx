import type { CafeProperties } from '../types';
import RadarChart from './RadarChart';

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${accent ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/70'}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-semibold text-white">{value}<span className="text-xs text-white/40">{unit}</span></span>
    </div>
  );
}

export default function DetailCard({ p, onClose }: { p: CafeProperties; onClose: () => void }) {
  return (
    <div className="pointer-events-auto w-full md:max-w-sm max-h-[70vh] md:max-h-[90vh] overflow-y-auto rounded-2xl bg-panel border border-panel-border backdrop-blur-xl shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between p-3 md:p-4 bg-panel/90 backdrop-blur border-b border-panel-border">
        <h2 className="text-lg font-bold text-white truncate pr-4">{p.name}</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white text-xl">&times;</button>
      </div>

      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          {p.brand && <Tag accent>{p.brand}</Tag>}
          <Tag>{p.brandCategory === 'chain' ? '连锁' : p.brandCategory === 'independent' ? '独立' : p.brandCategory === 'bookstore' ? '书店' : '其他'}</Tag>
          {p.district && <Tag>{p.district}</Tag>}
        </div>

        <RadarChart props={p as unknown as Record<string, unknown>} />

        <div className="grid grid-cols-3 gap-2">
          <Stat label="综合分" value={p.score ?? '-'} />
          <Stat label="人均" value={p.avgPrice ?? '-'} unit="¥" />
          <Stat label="评分" value={p.rating ?? '-'} />
          <Stat label="500m内" value={p.nearbyCafes500m ?? '-'} unit="家" />
          <Stat label="1km内" value={p.nearbyCafes1km ?? '-'} unit="家" />
          <Stat label="地铁距离" value={p.nearbyMetro !== undefined ? Math.round(p.nearbyMetro) : '-'} unit="m" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-1">推荐理由</h3>
          <p className="text-sm text-white/70 leading-relaxed">{p.aiRecommend || '暂无推荐理由'}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-1">空间风格</h3>
          <p className="text-sm text-white/70">{p.aiStyle || '暂无描述'}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-1">适合人群</h3>
          <p className="text-sm text-white/70">{p.aiCrowd || '暂无描述'}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-1">标签</h3>
          <div className="flex flex-wrap gap-1.5">
            {[...(p.tags ?? []), ...(p.aiTags ?? [])].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-white/60 border border-white/5">{t}</span>
            ))}
          </div>
        </div>

        <div className="space-y-1 text-xs text-white/40">
          <p>📍 {p.address}</p>
          {p.phone && <p>📞 {p.phone}</p>}
          {p.businessHours && <p>🕐 {p.businessHours}</p>}
          <p>🔄 更新于 {p.lastUpdated}</p>
          <p>📡 来源：{p.dataSource}</p>
        </div>
      </div>
    </div>
  );
}
