import { dhis2Client } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, STAGE_LABTEST_ID } from './constants';

/**
 * 生成Event UID
 */
export async function generateEventUid(): Promise<string> {
  const res = await dhis2Client.get<{ codes: string[] }>('/api/system/id', { limit: 1 });
  return res.codes[0];
}

/**
 * 创建检测记录
 */
export interface CreateLabTestPayload {
  enrollment: string;
  trackedEntity: string;
  orgUnit: string;
  occurredAt: string; // Report date YYYY-MM-DD
  scheduledAt?: string; // Scheduled date YYYY-MM-DD
  testType: string; // DeUnkTstTp1
  sampleCollectionDate: string; // DeUnkSmplDt YYYY-MM-DD
  testStatus: string; // DeUnkTstSt1
  confirmedDiseaseName?: string; // DeConfDis01
  testDate?: string; // DeUnkTstDt1 YYYY-MM-DD
  testResult?: string; // DeUnkTstRst
  testNo: string; // DeUnkTstNo1
  labReportUrl?: string; // DeUnkLabUrl
  testOrgName?: string; // DeUnkTstOrg
  confirmedPathogen?: string; // DeConfPath1
  sampleType: string; // DeUnkSmplTp
  resultDetails?: string; // DeUnkRstDtl
  completeEvent: boolean;
  assignedUser?: {
    uid: string;
    displayName: string;
    username: string;
    firstName: string;
    surname: string;
  };
  notes?: Array<{ value: string }>;
}

export async function createLabTestEvent(payload: CreateLabTestPayload) {
  const eventUid = await generateEventUid();

  const body = {
    events: [
      {
        event: eventUid,
        status: payload.completeEvent ? 'COMPLETED' : 'ACTIVE',
        program: PROGRAM_UNKNOWN_ID,
        programStage: STAGE_LABTEST_ID,
        enrollment: payload.enrollment,
        trackedEntity: payload.trackedEntity,
        orgUnit: payload.orgUnit,
        occurredAt: payload.occurredAt,
        ...(payload.scheduledAt && { scheduledAt: payload.scheduledAt }),
        ...(payload.assignedUser && { assignedUser: payload.assignedUser }),
        ...(payload.notes && payload.notes.length > 0 && { notes: payload.notes }),
        dataValues: [
          { dataElement: 'DeUnkTstTp1', value: payload.testType },
          { dataElement: 'DeUnkSmplDt', value: payload.sampleCollectionDate },
          { dataElement: 'DeUnkTstSt1', value: payload.testStatus },
          { dataElement: 'DeUnkTstNo1', value: payload.testNo },
          { dataElement: 'DeUnkSmplTp', value: payload.sampleType },
          ...(payload.confirmedDiseaseName ? [{ dataElement: 'DeConfDis01', value: payload.confirmedDiseaseName }] : []),
          ...(payload.testDate ? [{ dataElement: 'DeUnkTstDt1', value: payload.testDate }] : []),
          ...(payload.testResult ? [{ dataElement: 'DeUnkTstRst', value: payload.testResult }] : []),
          ...(payload.labReportUrl ? [{ dataElement: 'DeUnkLabUrl', value: payload.labReportUrl }] : []),
          ...(payload.testOrgName ? [{ dataElement: 'DeUnkTstOrg', value: payload.testOrgName }] : []),
          ...(payload.confirmedPathogen ? [{ dataElement: 'DeConfPath1', value: payload.confirmedPathogen }] : []),
          ...(payload.resultDetails ? [{ dataElement: 'DeUnkRstDtl', value: payload.resultDetails }] : []),
        ],
      },
    ],
  };

  return dhis2Client.post<any>('/api/42/tracker', body, { async: 'false' });
}

/**
 * 更新检测记录
 */
export interface UpdateLabTestPayload extends CreateLabTestPayload {
  event: string;
}

export async function updateLabTestEvent(payload: UpdateLabTestPayload) {
  const body = {
    events: [
      {
        event: payload.event,
        status: payload.completeEvent ? 'COMPLETED' : 'ACTIVE',
        program: PROGRAM_UNKNOWN_ID,
        programStage: STAGE_LABTEST_ID,
        enrollment: payload.enrollment,
        trackedEntity: payload.trackedEntity,
        orgUnit: payload.orgUnit,
        occurredAt: payload.occurredAt,
        ...(payload.scheduledAt && { scheduledAt: payload.scheduledAt }),
        ...(payload.assignedUser && { assignedUser: payload.assignedUser }),
        ...(payload.notes && payload.notes.length > 0 && { notes: payload.notes }),
        dataValues: [
          { dataElement: 'DeUnkTstTp1', value: payload.testType },
          { dataElement: 'DeUnkSmplDt', value: payload.sampleCollectionDate },
          { dataElement: 'DeUnkTstSt1', value: payload.testStatus },
          { dataElement: 'DeUnkTstNo1', value: payload.testNo },
          { dataElement: 'DeUnkSmplTp', value: payload.sampleType },
          { dataElement: 'DeConfDis01', value: payload.confirmedDiseaseName || null },
          { dataElement: 'DeUnkTstDt1', value: payload.testDate || null },
          { dataElement: 'DeUnkTstRst', value: payload.testResult || null },
          { dataElement: 'DeUnkLabUrl', value: payload.labReportUrl || null },
          { dataElement: 'DeUnkTstOrg', value: payload.testOrgName || null },
          { dataElement: 'DeConfPath1', value: payload.confirmedPathogen || null },
          { dataElement: 'DeUnkRstDtl', value: payload.resultDetails || null },
        ],
      },
    ],
  };

  return dhis2Client.post<any>('/api/42/tracker', body, { async: 'false', importStrategy: 'UPDATE' });
}

/**
 * 获取检测记录详情
 */
export async function getLabTestEventDetail(eventUid: string) {
  return dhis2Client.get<any>(`/api/42/tracker/events/${eventUid}`);
}

/**
 * 查询用户
 */
export interface UserLookupResult {
  users: Array<{
    id: string;
    username: string;
    firstName: string;
    surname: string;
    displayName: string;
  }>;
}

export async function searchUsers(query: string): Promise<UserLookupResult> {
  return dhis2Client.get<UserLookupResult>('/api/42/userLookup', { query });
}

/**
 * 获取当前用户信息
 */
export interface CurrentUser {
  username: string;
  surname: string;
  firstName: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return dhis2Client.get<CurrentUser>('/api/42/me', { fields: 'firstName,surname,username' });
}