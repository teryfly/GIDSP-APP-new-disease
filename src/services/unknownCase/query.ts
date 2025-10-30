import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, ATR_UNK_NO, ATR_FULL_NAME } from './constants';
import type { TEIQueryResponse } from './types';

export async function queryUnknownCases(params: {
  ouId: string;
  page: number;
  pageSize: number;
  order?: 'createdAt:asc' | 'createdAt:desc' | 'updatedAt:asc' | 'updatedAt:desc' | 'enrolledAt:asc' | 'enrolledAt:desc';
  caseNoLike?: string;
  patientNameLike?: string;
  enrolledAfter?: string;   // YYYY-MM-DD
  enrolledBefore?: string;  // YYYY-MM-DD
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
  if (params.enrolledAfter) query.enrollmentEnrolledAfter = params.enrolledAfter;
  if (params.enrolledBefore) query.enrollmentEnrolledBefore = params.enrolledBefore;

  const filters: string[] = [];
  if (params.caseNoLike) filters.push(`${ATR_UNK_NO}:ilike:${params.caseNoLike}`);
  if (params.patientNameLike) filters.push(`${ATR_FULL_NAME}:ilike:${params.patientNameLike}`);

  filters.forEach((f) => {
    query['filter'] = (query['filter'] || []).concat(f);
  });

  return dhis2Client.get<TEIQueryResponse>('/api/tracker/trackedEntities', query);
}