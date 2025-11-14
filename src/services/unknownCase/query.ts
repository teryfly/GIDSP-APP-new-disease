import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, ATR_UNK_NO, ATR_FULL_NAME, ATR_RPT_DATE } from './constants';
import type { TEIQueryResponse } from './types';

export async function queryUnknownCases(params: {
  ouId: string;
  page: number;
  pageSize: number;
  order?: 'createdAt:asc' | 'createdAt:desc' | 'updatedAt:asc' | 'updatedAt:desc' | 'enrolledAt:asc' | 'enrolledAt:desc';
  caseNoLike?: string;
  patientNameLike?: string;
  reportDateEq?: string;   // YYYY-MM-DD - 新增：报告日期精确匹配
  statusCodeEq?: string;    // Ignored by TEI query in current contract
}) {
  const fields = buildFieldsParam([
    'trackedEntity,orgUnit,createdAt,updatedAt',
    'attributes[attribute,value,displayName]',
    'enrollments[enrollment,enrolledAt,status,attributes[attribute,value]]',
  ]);

  const query: Record<string, any> = {
    program: PROGRAM_UNKNOWN_ID,
    orgUnits: params.ouId,
    orgUnitMode: 'DESCENDANTS',
    fields,
    page: params.page,
    pageSize: params.pageSize,
    order: params.order || 'createdAt:desc',
    totalPages: 'true',
  };

  const filters: string[] = [];
  if (params.caseNoLike) filters.push(`${ATR_UNK_NO}:ilike:${params.caseNoLike}`);
  if (params.patientNameLike) filters.push(`${ATR_FULL_NAME}:ilike:${params.patientNameLike}`);
  if (params.reportDateEq) filters.push(`${ATR_RPT_DATE}:eq:${params.reportDateEq}`); // 新增：报告日期精确匹配

  filters.forEach((f) => {
    query['filter'] = (query['filter'] || []).concat(f);
  });

  return dhis2Client.get<TEIQueryResponse>('/api/tracker/trackedEntities', query);
}