import dayjs from 'dayjs';
import { dhis2Client, buildFieldsParam } from '../api/dhis2Client';
import { PROGRAM_ID, PROGRAM_STAGE_INVESTIGATION_ID } from './caseDetailsService';

// 常量与映射（导出给 builder/页面使用）
export const TET_PERSON_ID = 'TetPerson01';
export const ATR_FULL_NAME = 'AtrFullNm01';
export const ATR_NATIONAL_ID = 'AtrNatnlId1';
export const ATR_GENDER = 'AtrGender01';
export const ATR_AGE = 'AtrAge00001';
export const ATR_PHONE = 'AtrPhone001';
export const ATR_ADDRESS = 'AtrAddr0001';
export const ATR_DISEASE_CODE = 'AtrDiseaCd1';
export const ATR_RPT_ORG = 'AtrRptOrg01';
export const ATR_RPT_DATE = 'AtrRptDt001';
export const ATR_SYMPT_DT = 'AtrSymptDt1';
export const ATR_DIAG_DT = 'AtrDiagDt01';
export const ATR_CASE_SRC = 'AtrCaseSrc1';
export const DE_CASE_STATUS = 'DeCaseStat1';
export const DE_EXPOSURE = 'DeExposHst1';
export const DE_CONTACT = 'DeContHst01';
export const DE_TRAVEL = 'DeTravHst01';

export function mapGenderToCode(genderZh: '男' | '女' | '未知'): string {
  if (genderZh === '男') return 'MALE';
  if (genderZh === '女') return 'FEMALE';
  return 'UNKNOWN';
}

export interface Option { id: string; code: string; name: string }
export interface OptionSet { id: string; name: string; options: Option[] }

const optionSetCache = new Map<string, OptionSet>();
export async function loadOptionSetCached(id: string): Promise<OptionSet> {
  if (optionSetCache.has(id)) return optionSetCache.get(id)!;
  const fields = buildFieldsParam(['id', 'name', 'options[id,code,name]']);
  const os = await dhis2Client.get<OptionSet>(`/api/optionSets/${id}`, { fields });
  optionSetCache.set(id, os);
  return os;
}

export async function getMeDefaultOu(): Promise<{ id: string; name: string }> {
  const fields = buildFieldsParam(['organisationUnits[id,name]']);
  const me = await dhis2Client.get<any>('/api/me', { fields });
  const ou = me.organisationUnits?.[0];
  if (!ou) throw new Error('当前用户缺少可用组织机构');
  return { id: ou.id, name: ou.name };
}

export interface SearchPersonResult {
  trackedEntity: string;
  orgUnit: string;
  attributes: Array<{ attribute: string; value: string }>;
}
export async function searchPersonByNationalId(nationalId: string, orgUnitId: string): Promise<SearchPersonResult | null> {
  const fields = buildFieldsParam(['trackedEntity,trackedEntityType,orgUnit', 'attributes[attribute,value]']);
  const res = await dhis2Client.get<{ trackedEntities: SearchPersonResult[] }>(
    '/api/tracker/trackedEntities',
    {
      trackedEntityType: TET_PERSON_ID,
      orgUnits: orgUnitId,
      orgUnitMode: 'DESCENDANTS',
      filter: `${ATR_NATIONAL_ID}:eq:${nationalId}`,
      page: 1,
      pageSize: 50,
      fields,
    },
  );
  return res.trackedEntities?.[0] || null;
}

// 统一同步导入
export async function postTrackerSync(body: any, params: Record<string, string>) {
  return dhis2Client.post('/api/tracker', body, { ...params, async: 'false' });
}

export async function createCaseNested(payload: any) {
  return postTrackerSync(payload, { importStrategy: 'CREATE', atomicMode: 'OBJECT' });
}

export async function createOrUpdateEnrollment(body: any) {
  return postTrackerSync(body, { importStrategy: 'CREATE_AND_UPDATE', atomicMode: 'OBJECT' });
}

export async function upsertEvents(body: any, isUpdate = false) {
  return postTrackerSync(body, { importStrategy: isUpdate ? 'UPDATE' : 'CREATE_AND_UPDATE', atomicMode: 'OBJECT' });
}

// 草稿本地缓存
const DRAFT_KEY_PREFIX = 'WF44_DRAFT_';
export function saveDraftToLocal(nationalId: string, data: any) {
  try { localStorage.setItem(`${DRAFT_KEY_PREFIX}${nationalId}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
export function loadDraftFromLocal(nationalId: string): any | null {
  try { const s = localStorage.getItem(`${DRAFT_KEY_PREFIX}${nationalId}`); return s ? JSON.parse(s).data : null; } catch { return null; }
}
export function clearDraft(nationalId: string) {
  try { localStorage.removeItem(`${DRAFT_KEY_PREFIX}${nationalId}`); } catch {}
}