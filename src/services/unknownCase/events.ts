import { dhis2Client } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, STAGE_LABTEST_ID } from './constants';
import type { TrackerEvent } from './types';

export async function fetchLatestLabByEnrollment(enrollmentUid: string, trackedEntity?: string) {
  const params: any = {
    program: PROGRAM_UNKNOWN_ID,
    enrollment: enrollmentUid,
    programStage: STAGE_LABTEST_ID,
    order: 'occurredAt:desc',
    page: 1,
    pageSize: 1,
  };
  
  // 如果提供了trackedEntity，则添加过滤条件
  if (trackedEntity) {
    params.trackedEntity = trackedEntity;
  }
  
  return dhis2Client.get<{ pager: any; events: TrackerEvent[] }>('/api/tracker/events', params);
}