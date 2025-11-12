import { dhis2Client } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, STAGE_LABTEST_ID } from './constants';
import type { TrackerEvent } from './types';

export async function fetchLatestLabByEnrollment(enrollmentUid: string) {
  return dhis2Client.get<{ pager: any; events: TrackerEvent[] }>('/api/tracker/events', {
    program: PROGRAM_UNKNOWN_ID,
    enrollment: enrollmentUid,
    programStage: STAGE_LABTEST_ID,
    order: 'occurredAt:desc',
    page: 1,
    pageSize: 1,
  });
}