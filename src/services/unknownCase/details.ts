import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, STAGE_LABTEST_ID } from './constants';

export async function loadUnknownCaseDetails(teiUid: string) {
  const fields = buildFieldsParam([
    'trackedEntity,trackedEntityType,orgUnit',
    'attributes[attribute,value,displayName,valueType]',
    'enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,dataValues[dataElement,value]]]',
  ]);
  return dhis2Client.get<any>(`/api/tracker/trackedEntities/${teiUid}`, { program: PROGRAM_UNKNOWN_ID, fields });
}

export async function listLabEventsByEnrollment(enrollmentUid: string, page = 1, pageSize = 10) {
  return dhis2Client.get<{ pager: any; events: any[] }>('/api/tracker/events', {
    program: PROGRAM_UNKNOWN_ID,
    enrollment: enrollmentUid,
    programStage: STAGE_LABTEST_ID,
    order: 'occurredAt:desc',
    page,
    pageSize,
    totalPages: 'true',
  });
}

export async function getEventChangeLogs(eventUid: string, page = 1, pageSize = 20) {
  return dhis2Client.get<any>(`/api/tracker/events/${eventUid}/changeLogs`, {
    order: 'createdAt:desc',
    page,
    pageSize,
  });
}

export async function getEnrollmentChangeLogs(enrollmentUid: string, page = 1, pageSize = 20) {
  return dhis2Client.get<any>(`/api/tracker/enrollments/${enrollmentUid}/changeLogs`, {
    order: 'createdAt:desc',
    page,
    pageSize,
  });
}