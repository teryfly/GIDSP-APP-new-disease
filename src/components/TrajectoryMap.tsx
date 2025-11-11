import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import appConfig from '../config.json';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface RecordItem {
  id: string;
  caseId: string;
  date: string;
  type: string;
  location: string;
  lat?: number;
  lng?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  riskAssessment?: string;
}

interface TrajectoryMapProps {
  records: RecordItem[];
}

type LatLng = { lat: number; lng: number };

const geoCache = new Map<string, LatLng>();

async function geocodeByAMap(address: string): Promise<LatLng | null> {
  if (!address) return null;
  const cacheKey = address.trim();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  const key = (appConfig as any)?.amap?.key || '';
  const url = new URL('https://restapi.amap.com/v3/geocode/geo');
  url.searchParams.set('key', key);
  url.searchParams.set('address', address);

  try {
    const resp = await fetch(url.toString(), { method: 'GET' });
    const data = await resp.json();
    if (data?.status === '1' && Array.isArray(data?.geocodes) && data.geocodes.length > 0) {
      const loc = data.geocodes[0].location as string;
      if (loc && loc.includes(',')) {
        const [lngStr, latStr] = loc.split(',');
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const ll = { lat, lng };
          geoCache.set(cacheKey, ll);
          return ll;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
    } else {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p.lat, p.lng)));
      map.fitBounds(bounds.pad(0.2), { animate: true });
    }
  }, [points, map]);
  return null;
}

const TrajectoryMap = ({ records }: TrajectoryMapProps) => {
  const [resolved, setResolved] = useState<Array<RecordItem & LatLng>>([]);
  const [loading, setLoading] = useState(false);

  const fallbackCenter: LatLng = useMemo(() => {
    const cfg = (appConfig as any)?.amap?.fallbackCenter;
    const lat = Number(cfg?.lat) || 39.9042;
    const lng = Number(cfg?.lng) || 116.4074;
    return { lat, lng };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const out: Array<RecordItem & LatLng> = [];
        for (const r of records) {
          let lat = r.lat;
          let lng = r.lng;
          if (typeof lat === 'number' && typeof lng === 'number') {
            out.push({ ...r, lat, lng });
            continue;
          }
          const addr = r.location || '';
          const ll = await geocodeByAMap(addr);
          if (ll) {
            out.push({ ...r, lat: ll.lat, lng: ll.lng });
          } else {
            out.push({ ...r, lat: fallbackCenter.lat, lng: fallbackCenter.lng });
          }
        }
        if (!cancelled) setResolved(out);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [records, fallbackCenter.lat, fallbackCenter.lng]);

  if (!records.length) {
    return <div>无轨迹数据可供显示</div>;
  }

  const points = resolved.map(r => ({ lat: r.lat, lng: r.lng }));
  const first = points[0] || fallbackCenter;

  return (
    <div style={{ width: '100%', minHeight: 400, position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1000,
          background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4, fontSize: 12
        }}>
          正在解析地址坐标...
        </div>
      )}
      <MapContainer center={[first.lat, first.lng]} zoom={13} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <FitBounds points={points} />
        {resolved.length > 1 && (
          <Polyline pathOptions={{ color: 'blue' }} positions={resolved.map(r => [r.lat, r.lng] as [number, number])} />
        )}
        {resolved.map(record => (
          <Marker key={record.id} position={[record.lat, record.lng]}>
            <Popup>
              <strong>{record.location}</strong><br />
              {record.date} | {record.type}<br />
              {record.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default TrajectoryMap;