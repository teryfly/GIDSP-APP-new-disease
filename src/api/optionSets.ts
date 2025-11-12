import { dhis2Client, buildFieldsParam } from './dhis2Client';
import type { Dhis2OptionSet, Dhis2OptionSetsResponse } from '../types/dhis2';
import { OPTION_SET_IDS } from '../types/dhis2';

const LS_KEY = 'dhis2_option_sets_cache_v1';

type CachedOption = { id: string; code?: string; name: string; displayName?: string };
type CacheShape = {
  byId: Record<string, { id: string; name?: string; displayName?: string; options?: CachedOption[] }>;
  ts: number;
};

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(cache: CacheShape) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function ensureCache(): CacheShape {
  const c = readCache();
  if (c) return c;
  const empty: CacheShape = { byId: {}, ts: Date.now() };
  writeCache(empty);
  return empty;
}

export async function fetchAllOptionSets(): Promise<Dhis2OptionSetsResponse> {
  const fields = buildFieldsParam([
    ':all',
    'attributeValues[:all,attribute[id,name,displayName]]',
    'options',
  ]);
  return dhis2Client.get<Dhis2OptionSetsResponse>(`/api/29/optionSets`, {
    fields,
    paging: true,
    pageSize: 200,
  });
}

export async function fetchOptionSetById(id: string): Promise<Dhis2OptionSet> {
  const fields = buildFieldsParam([
    ':all',
    'attributeValues[:all,attribute[id,name,displayName]]',
    'options[id,name,displayName,code,style]',
  ]);
  return dhis2Client.get<Dhis2OptionSet>(`/api/29/optionSets/${id}`, { fields });
}

export async function loadOptionSetOptions(id: string): Promise<CachedOption[]> {
  const cache = ensureCache();
  const existing = cache.byId[id];
  if (existing?.options) return existing.options;

  // Try network
  const os = await fetchOptionSetById(id);
  const options = (os.options || []).map(o => ({
    id: o.id,
    code: o.code,
    name: o.name,
    displayName: o.displayName,
  }));
  cache.byId[id] = {
    id,
    name: os.name,
    displayName: os.displayName,
    options,
  };
  writeCache(cache);
  return options;
}

// Prime cache for required optionSets with fallback mapping if list call missing
export async function primeRequiredOptionSets(): Promise<void> {
  const requiredIds = [
    OPTION_SET_IDS.DiseaseCodes,
    OPTION_SET_IDS.Pathogens,
    OPTION_SET_IDS.DiseaseCategory,
    OPTION_SET_IDS.PathogenType,
    OPTION_SET_IDS.BioSafetyLevel,
    OPTION_SET_IDS.RiskLevel,
  ];
  const cache = ensureCache();
  const missing = requiredIds.filter(id => !cache.byId[id]?.options);
  for (const id of missing) {
    try {
      await loadOptionSetOptions(id);
    } catch {
      // best-effort; leave cache as-is
    }
  }
}

export function getOptionByCode(optionSetId: string, code?: string): CachedOption | undefined {
  if (!code) return undefined;
  const cache = ensureCache();
  const options = cache.byId[optionSetId]?.options || [];
  return options.find(o => o.code === code);
}

export function getOptionNameByCode(optionSetId: string, code?: string): string {
  return getOptionByCode(optionSetId, code)?.name || '';
}

export function listOptions(optionSetId: string): CachedOption[] {
  const cache = ensureCache();
  return cache.byId[optionSetId]?.options || [];
}