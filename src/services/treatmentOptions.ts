import { getOptionSetCached } from './caseDetailsService';

export interface OptionSet {
  id: string;
  name: string;
  options: Array<{ id: string; code: string; name: string }>;
}

// Option set IDs per contract
const OS_TREAT_TYPE_ID = 'OsTrtType01';
const OS_TREAT_OUTCOME_ID = 'OsTrtOutcm1';

let cachedType: OptionSet | null = null;
let cachedOutcome: OptionSet | null = null;

/**
 * Load treatment type option set (OsTrtType01)
 */
export async function loadTreatmentTypeOS(): Promise<OptionSet> {
  if (cachedType) return cachedType;
  cachedType = await getOptionSetCached(OS_TREAT_TYPE_ID);
  return cachedType!;
}

/**
 * Load treatment outcome option set (OsTrtOutcm1)
 */
export async function loadTreatmentOutcomeOS(): Promise<OptionSet> {
  if (cachedOutcome) return cachedOutcome;
  cachedOutcome = await getOptionSetCached(OS_TREAT_OUTCOME_ID);
  return cachedOutcome!;
}

/**
 * Build a code->name map from an OptionSet
 */
export function buildCodeNameMap(os: OptionSet): Map<string, string> {
  const m = new Map<string, string>();
  (os.options || []).forEach((o) => m.set(o.code, o.name));
  return m;
}

/**
 * Helper to get Chinese label by code from a provided map
 */
export function toLabel(code?: string, map?: Map<string, string>): string {
  if (!code) return '-';
  return map?.get(code) || code;
}