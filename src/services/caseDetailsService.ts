import { dhis2Client, buildFieldsParam } from '../api/dhis2Client';
import {
  PROGRAM_ID,
  PROGRAM_STAGE_INVESTIGATION_ID,
  STAGE_FOLLOW_UP,
  STAGE_TREATMENT,
  STAGE_TEST,
  STAGE_TRACKING,
  DE_CASE_STATUS,
  DE_EXPOSURE_HISTORY,
  DE_CONTACT_HISTORY,
  DE_TRAVEL_HISTORY,
  DE_PUSH_EPI,
  DE_PUSH_EPI_DT,
  ATR_CASE_NO,
  ATR_FULL_NAME,
  ATR_DISEASE_CODE,
  ATR_RPT_DATE,
  ATR_RPT_ORG,
  ATR_CASE_SRC,
} from './caseDetailsConsts';

// 透出常量给外部使用（避免其他模块直接依赖 consts 路径）
export {
  PROGRAM_ID,
  PROGRAM_STAGE_INVESTIGATION_ID,
  STAGE_FOLLOW_UP,
  STAGE_TREATMENT,
  STAGE_TEST,
  STAGE_TRACKING,
  DE_CASE_STATUS,
  DE_EXPOSURE_HISTORY,
  DE_CONTACT_HISTORY,
  DE_TRAVEL_HISTORY,
  DE_PUSH_EPI,
  DE_PUSH_EPI_DT,
  ATR_CASE_NO,
  ATR_FULL_NAME,
  ATR_DISEASE_CODE,
  ATR_RPT_DATE,
  ATR_RPT_ORG,
  ATR_CASE_SRC,
};

// 通用类型
export interface TrackerAttribute {
  attribute: string;
  value: string;
  displayName?: string;
  valueType?: string;
}
export interface TrackerDataValue {
  dataElement: string;
  value: string;
}
export interface TrackerEvent {
  event: string;
  program: string;
  programStage: string;
  enrollment: string;
  orgUnit: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULE';
  occurredAt: string;
  dataValues: TrackerDataValue[];
}
export interface TrackerEnrollment {
  enrollment: string;
  program: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  orgUnit: string;
  enrolledAt: string;
  occurredAt?: string;
  attributes?: Array<{ attribute: string; value: string }>;
  events?: TrackerEvent[];
}
export interface TrackedEntityDetails {
  trackedEntity: string;
  trackedEntityType: string;
  orgUnit: string;
  attributes: TrackerAttribute[];
  enrollments: TrackerEnrollment[];
}

// Program Full 元数据加载（包含Stages及DataElements定义）
export async function loadProgramFull() {
  const fields = buildFieldsParam([
    'id',
    'name',
    'trackedEntityType[id]',
    'programTrackedEntityAttributes[mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,name,options[id,code,name]]]]',
    'programStages[id,name,repeatable,programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,code,name]]]]]',
  ]);
  return dhis2Client.get<any>(`/api/programs/${PROGRAM_ID}`, { fields });
}

export interface Option { id: string; code: string; name: string }
export interface OptionSet { id: string; name: string; options: Option[] }
const optionSetCache = new Map<string, OptionSet>();
export async function getOptionSetCached(id: string): Promise<OptionSet> {
  if (optionSetCache.has(id)) return optionSetCache.get(id)!;
  const fields = buildFieldsParam(['id', 'name', 'options[id,code,name]']);
  const os = await dhis2Client.get<OptionSet>(`/api/optionSets/${id}`, { fields });
  optionSetCache.set(id, os);
  return os;
}

// 个案详情：加载TEI + Enrollment + 嵌套Events
export async function getCaseDetails(teiUid: string): Promise<TrackedEntityDetails> {
  const fields = buildFieldsParam([
    'trackedEntity,trackedEntityType,orgUnit',
    'attributes[attribute,value,displayName,valueType]',
    'enrollments[enrollment,program,status,orgUnit,enrolledAt,occurredAt,attributes[attribute,value],events[event,programStage,occurredAt,status,orgUnit,dataValues[dataElement,value]]]',
  ]);
  return dhis2Client.get<TrackedEntityDetails>(`/api/tracker/trackedEntities/${teiUid}`, {
    program: PROGRAM_ID,
    fields,
  });
}

export async function getEnrollment(enrollmentUid: string) {
  // API建议 fields=*,!relationships,!events,!attributes，可按需调整
  return dhis2Client.get<any>(`/api/tracker/enrollments/${enrollmentUid}`, {
    fields: '*',
  });
}

export interface EventsListResponse {
  pager: { page: number; pageSize: number; total?: number; pageCount?: number };
  events: TrackerEvent[];
}
export interface ListStageEventsParams {
  enrollment: string;
  programStage: string;
  page?: number;
  pageSize?: number;
  occurredAfter?: string;
  occurredBefore?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'SCHEDULE';
  order?: 'occurredAt:desc' | 'occurredAt:asc';
}
export async function listStageEvents(params: ListStageEventsParams, signal?: AbortSignal): Promise<EventsListResponse> {
  const {
    enrollment,
    programStage,
    page = 1,
    pageSize = 10,
    occurredAfter,
    occurredBefore,
    status,
    order = 'occurredAt:desc',
  } = params;

  const query: Record<string, any> = {
    program: PROGRAM_ID,
    enrollment,
    programStage,
    page,
    pageSize,
    order,
    totalPages: 'true',
  };
  if (occurredAfter) query.occurredAfter = occurredAfter;
  if (occurredBefore) query.occurredBefore = occurredBefore;
  if (status) query.status = status;

  return dhis2Client.get<EventsListResponse>('/api/tracker/events', query, signal);
}

export async function getEvent(eventUid: string) {
  const fields = buildFieldsParam([
    'event,program,programStage,enrollment,orgUnit,occurredAt,status',
    'dataValues[dataElement,value]',
  ]);
  return dhis2Client.get<any>(`/api/tracker/events/${eventUid}`, { fields });
}

export interface ImportReport {
  status: 'OK' | 'ERROR' | 'WARNING';
  stats: { created: number; updated: number; deleted: number; ignored: number; total: number };
  bundleReport?: any;
}

// 新增事件
export async function createEvents(events: Omit<TrackerEvent, 'event'>[]): Promise<ImportReport> {
  return dhis2Client.post<ImportReport>('/api/tracker', { events }, { importStrategy: 'CREATE', atomicMode: 'OBJECT' });
}

// 更新事件
export async function updateEvents(events: TrackerEvent[]): Promise<ImportReport> {
  return dhis2Client.post<ImportReport>('/api/tracker', { events }, { importStrategy: 'UPDATE', atomicMode: 'OBJECT' });
}

// 更新TEI属性
export async function updateTrackedEntities(payload: {
  trackedEntity: string;
  trackedEntityType: string;
  orgUnit: string;
  attributes: { attribute: string; value: string }[];
}[]): Promise<ImportReport> {
  return dhis2Client.post<ImportReport>('/api/tracker', { trackedEntities: payload }, { importStrategy: 'UPDATE', atomicMode: 'OBJECT' });
}

// 更新Enrollment属性
export async function updateEnrollments(payload: {
  enrollment: string;
  program: string;
  orgUnit: string;
  attributes: { attribute: string; value: string }[];
}[]): Promise<ImportReport> {
  return dhis2Client.post<ImportReport>('/api/tracker', { enrollments: payload }, { importStrategy: 'UPDATE', atomicMode: 'OBJECT' });
}

// 推送至流调（更新调查事件标记）
export async function pushToEpiFlag(params: {
  investigationEventUid: string;
  enrollment: string;
  orgUnit: string;
  occurredAt: string;
}): Promise<ImportReport> {
  const event: TrackerEvent = {
    event: params.investigationEventUid,
    program: PROGRAM_ID,
    programStage: PROGRAM_STAGE_INVESTIGATION_ID,
    enrollment: params.enrollment,
    orgUnit: params.orgUnit,
    status: 'ACTIVE',
    occurredAt: params.occurredAt,
    dataValues: [
      { dataElement: DE_PUSH_EPI, value: 'true' },
      { dataElement: DE_PUSH_EPI_DT, value: params.occurredAt },
    ],
  };
  return updateEvents([event]);
}

// 结案（设置个案状态为 CLOSED）
export async function closeCase(params: {
  investigationEventUid: string;
  enrollment: string;
  orgUnit: string;
  occurredAt: string;
}): Promise<ImportReport> {
  const event: TrackerEvent = {
    event: params.investigationEventUid,
    program: PROGRAM_ID,
    programStage: PROGRAM_STAGE_INVESTIGATION_ID,
    enrollment: params.enrollment,
    orgUnit: params.orgUnit,
    status: 'ACTIVE',
    occurredAt: params.occurredAt,
    dataValues: [{ dataElement: DE_CASE_STATUS, value: 'CLOSED' }],
  };
  return updateEvents([event]);
}

// 操作日志：事件日志
export interface ChangeLogsResponse {
  pager?: { page: number; pageSize: number; total?: number; pageCount?: number };
  changeLogs: Array<{
    createdBy: { uid: string; username: string };
    createdAt: string;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    change: any;
  }>;
}
export async function getEventChangeLogs(eventUid: string, page = 1, pageSize = 20) {
  return dhis2Client.get<ChangeLogsResponse>(`/api/tracker/events/${eventUid}/changeLogs`, {
    order: 'createdAt:desc',
    page,
    pageSize,
  });
}

// 操作日志：TEI日志
export async function getTeiChangeLogs(teiUid: string, page = 1, pageSize = 20) {
  return dhis2Client.get<ChangeLogsResponse>(`/api/tracker/trackedEntities/${teiUid}/changeLogs`, {
    program: PROGRAM_ID,
    order: 'createdAt:desc',
    page,
    pageSize,
  });
}