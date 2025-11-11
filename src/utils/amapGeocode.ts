import appConfig from '../config.json';

export interface LatLng {
  lat: number;
  lng: number;
}

const memoryCache = new Map<string, LatLng>();

function cacheKey(address: string, city?: string) {
  return `${(city || '').trim()}|${address.trim()}`;
}

export function getCachedGeocode(address: string, city?: string): LatLng | undefined {
  if (!address) return undefined;
  return memoryCache.get(cacheKey(address, city));
}

export function setCachedGeocode(address: string, city: string | undefined, ll: LatLng) {
  if (!address) return;
  memoryCache.set(cacheKey(address, city), ll);
}

export async function geocodeAddress(address: string, city?: string): Promise<LatLng | null> {
  if (!address) return null;
  const cached = getCachedGeocode(address, city);
  if (cached) return cached;

  const key = (appConfig as any)?.amap?.key || '';
  const defaultCity = (appConfig as any)?.amap?.defaultCity || '';

  const url = new URL('https://restapi.amap.com/v3/geocode/geo');
  url.searchParams.set('key', key);
  url.searchParams.set('address', address);
  if (city || defaultCity) url.searchParams.set('city', city || defaultCity);

  try {
    const resp = await fetch(url.toString(), { method: 'GET' });
    const data = await resp.json();
    if (data?.status === '1' && Array.isArray(data?.geocodes) && data.geocodes.length > 0) {
      const loc = data.geocodes[0].location as string; // "lng,lat"
      if (loc && loc.includes(',')) {
        const [lngStr, latStr] = loc.split(',');
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const ll = { lat, lng };
          setCachedGeocode(address, city || defaultCity, ll);
          return ll;
        }
      }
    }
  } catch {
    // ignore network errors
  }
  return null;
}