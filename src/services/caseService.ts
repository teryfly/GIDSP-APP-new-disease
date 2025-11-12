import { dhis2Client, buildFieldsParam } from '../api/dhis2Client';

export const PROGRAM_ID = 'PrgCaseMgt1';
export const PROGRAM_STAGE_INVESTIGATION_ID = 'PsInvestig1';
export const TET_PERSON_ID = 'TetPerson01';
export const OS_DISEASE_ID = 'OsDiseasCd1';
export const OS_CASE_STATUS_ID = 'OsCaseStat1';

export const ATR_CASE_NO = 'AtrCaseNo01';
export const ATR_FULL_NAME = 'AtrFullNm01';
export const ATR_DISEASE_CODE = 'AtrDiseaCd1';
export const ATR_RPT_DATE = 'AtrRptDt001';
export const ATR_RPT_ORG = 'AtrRptOrg01';
export const ATR_CASE_SRC = 'AtrCaseSrc1';

export const DE_PUSH_EPI = 'DePushEpi01';
export const DE_CASE_STATUS = 'DeCaseStat1';


export interface Option {
  id: string;
  code: string;
  name: string;
}
export interface OptionSet {
  id: string;
  name: string;
  options: Option[];
}
export interface ProgramMetadata {
  id: string;
  name: string;
  programType: string;
  trackedEntityType: {
    id: string;
  };
  programTrackedEntityAttributes: Array<{
    id: string;
    mandatory: boolean;
    trackedEntityAttribute: {
      id: string;
      name: string;
      valueType: string;
      optionSet?: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface MeResponse {
  id: string;
  username: string;
  organisationUnits: Array<{ id: string; name: string; path: string }>;
}

export interface OrgUnit {
  id: string;
  name: string;
  code?: string;
  level?: number;
  path?: string;
}

export interface TrackedEntity {
  trackedEntity: string;
  trackedEntityType: string;
  createdAt: string;
  updatedAt: string;
  orgUnit: string;
  attributes: Array<{ attribute: string; value: string; displayName?: string; valueType?: string }>;
  enrollments: Array<{
    enrollment: string;
    enrolledAt: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    attributes?: Array<{ attribute: string; value: string }>;
  }>;
}

export interface TEIQueryResponse {
  pager: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  trackedEntities: TrackedEntity[];
}

export async function getProgramMetadata(): Promise<ProgramMetadata> {
  const fields = buildFieldsParam([
    'id',
    'name',
    'programType',
    'trackedEntityType[id]',
    'programTrackedEntityAttributes[id,mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name]]]',
  ]);
  const res = await dhis2Client.get<{ programs: ProgramMetadata[] }>('/api/programs', {
    filter: `id:eq:${PROGRAM_ID}`,
    fields,
  });
  if (!res.programs?.length) {
    throw new Error('Program metadata not found for PrgCaseMgt1');
  }
  return res.programs[0];
}

export async function getOptionSet(optionSetId: string): Promise<OptionSet> {
  const fields = buildFieldsParam(['id', 'name', 'options[id,code,name]']);
  return await dhis2Client.get<OptionSet>(`/api/optionSets/${optionSetId}`, { fields });
}

export async function getMe(): Promise<MeResponse> {
  const fields = buildFieldsParam(['id', 'username', 'organisationUnits[id,name,path]']);
  return await dhis2Client.get<MeResponse>('/api/me', { fields });
}

export async function getOrgUnitsByPath(pathLike: string): Promise<OrgUnit[]> {
  const fields = buildFieldsParam(['id', 'name', 'code', 'level', 'path']);
  const res = await dhis2Client.get<{ organisationUnits: OrgUnit[] }>('/api/organisationUnits', {
    filter: `path:like:${pathLike}`,
    fields,
  });
  return res.organisationUnits || [];
}

/**
 * 获取所有机构单位，用于值域集单选
 * @returns 机构单位列表
 */
export async function getAllOrgUnits(): Promise<OrgUnit[]> {
  const fields = buildFieldsParam(['id', 'name', 'code', 'level', 'path']);
  const res = await dhis2Client.get<{ organisationUnits: OrgUnit[] }>('/api/organisationUnits', {
    paging: false,
    fields,
  });
  return res.organisationUnits || [];
}

export interface CaseFilters {
  caseNoLike?: string;
  patientNameLike?: string;
  diseaseCodeEq?: string; // option code
  enrolledAfter?: string; // YYYY-MM-DD
  enrolledBefore?: string; // YYYY-MM-DD
  statusCodeEq?: string; // not directly filterable via enrollment, provided to support future; main list status is stage data element
  orgUnitId?: string;
  page?: number;
  pageSize?: number;
  order?: 'createdAt:asc' | 'createdAt:desc' | 'updatedAt:asc' | 'updatedAt:desc' | 'enrolledAt:asc' | 'enrolledAt:desc';
}

export async function queryTrackedEntities(filters: CaseFilters, signal?: AbortSignal): Promise<TEIQueryResponse> {
  const {
    caseNoLike,
    patientNameLike,
    diseaseCodeEq,
    enrolledAfter,
    enrolledBefore,
    orgUnitId,
    page = 1,
    pageSize = 50,
    order = 'createdAt:desc',
  } = filters;

  const fields = buildFieldsParam([
    'trackedEntity,trackedEntityType,createdAt,updatedAt,orgUnit',
    'attributes[attribute,value,displayName,valueType]',
    'enrollments[enrollment,enrolledAt,status,attributes[attribute,value]]',
  ]);

  const params: Record<string, any> = {
    program: PROGRAM_ID,
    fields,
    page,
    pageSize,
    order,
    totalPages: 'true',
    orgUnitMode: 'DESCENDANTS',
    programStatus: 'ACTIVE',
  };

  if (orgUnitId) params.orgUnits = orgUnitId;
  if (enrolledAfter) params.enrollmentEnrolledAfter = enrolledAfter;
  if (enrolledBefore) params.enrollmentEnrolledBefore = enrolledBefore;

  const filterArr: string[] = [];
  if (caseNoLike) filterArr.push(`${ATR_CASE_NO}:like:${caseNoLike}`);
  if (patientNameLike) filterArr.push(`${ATR_FULL_NAME}:like:${patientNameLike}`);
  if (diseaseCodeEq) filterArr.push(`${ATR_DISEASE_CODE}:eq:${diseaseCodeEq}`);

  const searchParams: Record<string, any> = { ...params };
  filterArr.forEach((f) => {
    searchParams[`filter`] = (searchParams[`filter`] || []).concat(f);
  });

  return await dhis2Client.get<TEIQueryResponse>('/api/tracker/trackedEntities', searchParams, signal);
}

export async function deleteTrackedEntity(teiUid: string): Promise<void> {
  await dhis2Client.delete(`/api/tracker/trackedEntities/${teiUid}`);
}

export interface BatchPushEventInput {
  event: string;
  programStage: string;
  program: string;
  enrollment: string;
  trackedEntity: string;
  orgUnit: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULE';
  occurredAt: string;
  dataValues: Array<{ dataElement: string; value: string }>;
}

export interface TrackerImportReport {
  status: 'OK' | 'ERROR' | 'WARNING';
  stats: { created: number; updated: number; deleted: number; ignored: number; total: number };
  bundleReport?: any;
}

export async function batchPushToEpi(events: BatchPushEventInput[]): Promise<TrackerImportReport> {
  const payload = { events };
  const params = {
    importStrategy: 'UPDATE',
    atomicMode: 'OBJECT',
  };
  const res = await dhis2Client.post<TrackerImportReport>('/api/tracker', payload, params);
  return res;
}