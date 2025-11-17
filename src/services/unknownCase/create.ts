import { dhis2Client } from '../../api/dhis2Client';
import { PROGRAM_UNKNOWN_ID, STAGE_REGISTER_ID } from './constants';

/**
 * 生成不明病例编号
 */
export async function generateUnknownCaseNo(): Promise<string> {
  const res = await dhis2Client.get<{
    ownerObject: string;
    ownerUid: string;
    key: string;
    value: string;
    created: string;
    expiryDate: string;
  }>('/api/42/trackedEntityAttributes/AtrUnkNo001/generate', { expiration: 3 });
  return res.value;
}

/**
 * 生成TrackedEntity UID
 */
export async function generateTeiUid(): Promise<string> {
  const res = await dhis2Client.get<{ codes: string[] }>('/api/system/id', { limit: 1 });
  return res.codes[0];
}

/**
 * 生成Event UID
 */
export async function generateEventUid(): Promise<string> {
  const res = await dhis2Client.get<{ codes: string[] }>('/api/system/id', { limit: 1 });
  return res.codes[0];
}

/**
 * 获取所有组织机构列表
 */
export async function getAllOrgUnits(): Promise<Array<{ id: string; displayName: string }>> {
  const res = await dhis2Client.get<{
    organisationUnits: Array<{ id: string; displayName: string }>;
  }>('/api/organisationUnits', { paging: 'false' });
  return res.organisationUnits || [];
}

/**
 * 获取不明病例状态选项集
 */
export async function getUnknownStatusOptions(): Promise<Array<{ id: string; displayName: string; code: string }>> {
  const res = await dhis2Client.get<{
    options: Array<{ id: string; displayName: string; code: string }>;
  }>('/api/optionSets/OsUnkStat01', { fields: 'options[id,displayName,code]' });
  return res.options || [];
}

/**
 * Step 1: 创建Person及Enrollment
 */
export interface CreatePersonPayload {
  trackedEntity: string;
  orgUnit: string;
  caseNo: string;
  fullName: string;
  nationalId?: string;
  gender: string;
  age: number;
  phone: string;
  address: string;
  reportOrg: string;
  reportDate: string;
  symptomDate: string;
  clinicalSymptoms: string;
  suspectedPathogen?: string;
  enrolledAt: string; // 登记日期
}

export async function createPersonWithEnrollment(payload: CreatePersonPayload) {
  // 生成Event UID
  const eventUid = await generateEventUid();

  const body = {
    trackedEntities: [
      {
        trackedEntity: payload.trackedEntity,
        orgUnit: payload.orgUnit,
        trackedEntityType: 'TetPerson01',
        attributes: [
          { attribute: 'AtrUnkNo001', value: payload.caseNo },
          { attribute: 'AtrFullNm01', value: payload.fullName },
          ...(payload.nationalId ? [{ attribute: 'AtrNatnlId1', value: payload.nationalId }] : []),
          { attribute: 'AtrGender01', value: payload.gender },
          { attribute: 'AtrAge00001', value: String(payload.age) },
          { attribute: 'AtrPhone001', value: payload.phone },
          { attribute: 'AtrAddr0001', value: payload.address },
          { attribute: 'AtrRptOrg01', value: payload.reportOrg },
          { attribute: 'AtrRptDt001', value: payload.reportDate },
          { attribute: 'AtrSymptDt1', value: payload.symptomDate },
          { attribute: 'AtrUnkSymp1', value: payload.clinicalSymptoms },
          ...(payload.suspectedPathogen ? [{ attribute: 'AtrUnkPath1', value: payload.suspectedPathogen }] : []),
        ],
        enrollments: [
          {
            program: PROGRAM_UNKNOWN_ID,
            status: 'ACTIVE',
            orgUnit: payload.orgUnit,
            occurredAt: payload.reportDate,
            enrolledAt: payload.enrolledAt,
            attributes: [
              { attribute: 'AtrUnkNo001', value: payload.caseNo },
              { attribute: 'AtrFullNm01', value: payload.fullName },
              ...(payload.nationalId ? [{ attribute: 'AtrNatnlId1', value: payload.nationalId }] : []),
              { attribute: 'AtrGender01', value: payload.gender },
              { attribute: 'AtrAge00001', value: String(payload.age) },
              { attribute: 'AtrPhone001', value: payload.phone },
              { attribute: 'AtrAddr0001', value: payload.address },
              { attribute: 'AtrRptOrg01', value: payload.reportOrg },
              { attribute: 'AtrRptDt001', value: payload.reportDate },
              { attribute: 'AtrSymptDt1', value: payload.symptomDate },
              { attribute: 'AtrUnkSymp1', value: payload.clinicalSymptoms },
              ...(payload.suspectedPathogen ? [{ attribute: 'AtrUnkPath1', value: payload.suspectedPathogen }] : []),
            ],
            events: [
              {
                event: eventUid,
                attributeCategoryOptions: '',
                status: 'SCHEDULE',
                scheduledAt: payload.enrolledAt,
                programStage: STAGE_REGISTER_ID,
                program: PROGRAM_UNKNOWN_ID,
                orgUnit: payload.orgUnit,
              },
            ],
          },
        ],
      },
    ],
  };

  return dhis2Client.post<any>('/api/42/tracker', body, { async: 'false' });
}

/**
 * Step 2: 更新登记事件
 */
export interface UpdateRegisterEventPayload {
  event: string;
  enrollment: string;
  trackedEntity: string;
  orgUnit: string;
  occurredAt: string; // Report date
  scheduledAt: string; // Scheduled date
  pushedToCase: boolean;
  pushedToEpi: boolean;
  pushedCaseId?: string;
  pushedToEmergency: number; // 修改为数字类型：1表示是，2表示否
  emergencyTime?: string; // ISO datetime
  pushCaseTime?: string; // ISO datetime
  pushEpiTime?: string; // ISO datetime
  status: string; // 不明病例状态 code
  completeEvent: boolean; // Complete event 复选框
  
  // 新增属性（当pushedToEmergency为1时传值）
  alertId?: string;        // 预警ID
  alertTitle?: string;     // 标题
  alertContent?: string;   // 内容
  alertTypeName?: string;  // 预警类型名称
  alertSource?: string;    // 来源（固定值为"SCLOWCODE"）
  alertTime?: string;      // 预警时间（ISO datetime）
  alertEventId?: string;   // 事件ID
  alertModifyType?: string; // 添加或修改类型
  alertStatus?: string;    // 预警状态
}

export async function updateRegisterEvent(payload: UpdateRegisterEventPayload) {
  // 构建基础数据值数组
  const dataValues: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: 'DePushCase1', value: String(payload.pushedToCase) },
    { dataElement: 'DeUnkPshEpi', value: String(payload.pushedToEpi) },
    { dataElement: 'DePushCsId1', value: payload.pushedCaseId || null },
    { dataElement: 'DePushEmg01', value: String(payload.pushedToEmergency) }, // 修改为数字类型
    { dataElement: 'DePushEmgDt', value: payload.emergencyTime || null },
    { dataElement: 'DePushCsDt1', value: payload.pushCaseTime || null },
    { dataElement: 'DeUnkPshDt1', value: payload.pushEpiTime || null },
    { dataElement: 'DeUnkStat01', value: payload.status },
  ];

  // 仅当已上报应急系统为1时，添加新增属性
  if (payload.pushedToEmergency === 1) {
    dataValues.push(
      { dataElement: 'a4N9z9gZaJc', value: payload.alertId || null },      // 预警ID
      { dataElement: 'rG1gIAVrgKK', value: payload.alertTitle || null },   // 标题
      { dataElement: 'pjYdGWLER7d', value: payload.alertContent || null }, // 内容
      { dataElement: 'liKIghiuKTt', value: payload.alertTypeName || null }, // 预警类型名称
      { dataElement: 'm9Pa8zeSCNG', value: payload.alertSource || 'SCLOWCODE' }, // 来源
      { dataElement: 'O5kMFPyrkmj', value: payload.alertTime || null },          // 预警时间
      { dataElement: 'QOk13DNk20K', value: payload.alertEventId || null }, // 事件ID
      { dataElement: 'wOlEjbF6Ija', value: payload.alertModifyType || null }, // 添加或修改类型
      { dataElement: 'YAhyASn12MH', value: payload.alertStatus || null }   // 预警状态
    );
  }

  const body = {
    events: [
      {
        event: payload.event,
        status: payload.completeEvent ? 'COMPLETED' : 'ACTIVE',
        program: PROGRAM_UNKNOWN_ID,
        programStage: STAGE_REGISTER_ID,
        enrollment: payload.enrollment,
        trackedEntity: payload.trackedEntity,
        orgUnit: payload.orgUnit,
        occurredAt: payload.occurredAt,
        scheduledAt: payload.scheduledAt,
        dataValues: dataValues,
      },
    ],
  };

  return dhis2Client.post<any>('/api/42/tracker', body, { async: 'false', importStrategy: 'UPDATE' });
}