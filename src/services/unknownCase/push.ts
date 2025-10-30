import dayjs from 'dayjs';
import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import {
  PROGRAM_UNKNOWN_ID,
  STAGE_REGISTER_ID,
  OS_UNK_STATUS_ID,
} from './constants';

// 复用目标个案管理 Program 常量（PrgCaseMgt1）
import {
  PROGRAM_ID as PROGRAM_CASE_ID,
  PROGRAM_STAGE_INVESTIGATION_ID as STAGE_INVESTIGATION_ID,
} from '../caseDetailsService';

export interface PushPrecheckResult {
  hasConflict: boolean;
  conflictEnrollmentUid?: string;
  conflictDiseaseCode?: string;
}

export async function checkAlreadyEnrolledInProgram1(teiUid: string): Promise<PushPrecheckResult> {
  const fields = buildFieldsParam([
    'trackedEntity',
    'enrollments[enrollment,program,status,attributes[attribute,value]]',
  ]);
  const res = await dhis2Client.get<any>(`/api/tracker/trackedEntities/${teiUid}`, {
    program: PROGRAM_CASE_ID,
    fields,
  });
  const enr = (res?.enrollments || []).find((e: any) => e.program === PROGRAM_CASE_ID && e.status !== 'CANCELLED');
  if (!enr) return { hasConflict: false };
  const attrs = new Map((enr.attributes || []).map((a: any) => [a.attribute, a.value]));
  return { hasConflict: true, conflictEnrollmentUid: enr.enrollment, conflictDiseaseCode: attrs.get('AtrDiseaCd1') };
}

export interface UnknownContext {
  teiUid: string;
  orgUnit: string;
  enrollmentUid: string;
  reportDate: string;      // YYYY-MM-DD
  symptomOnsetDate: string; // YYYY-MM-DD
  registerEventUid: string; // PsRegister1 事件UID
  confirmedPathogenCode?: string; // DeConfPath1 的 option code（来自最新实验室事件）
  confirmedDiseaseCode: string;   // 映射得到的 OsDiseasCd1 code
  initialDiagnosisText?: string;  // 用于写入调查事件初诊文本
}

/**
 * API-10: 创建 Program1（PrgCaseMgt1）入组 + 嵌套调查事件
 */
export async function createProgram1EnrollmentWithInvestigation(ctx: UnknownContext) {
  const occurredAt = dayjs().toISOString();
  const payload = {
    enrollments: [
      {
        program: PROGRAM_CASE_ID,
        trackedEntity: ctx.teiUid,
        orgUnit: ctx.orgUnit,
        status: 'ACTIVE',
        enrolledAt: dayjs(ctx.reportDate).toISOString(),
        occurredAt: dayjs(ctx.symptomOnsetDate).toISOString(),
        attributes: [
          { attribute: 'AtrDiseaCd1', value: ctx.confirmedDiseaseCode },
          { attribute: 'AtrCaseSrc1', value: 'UNKNOWN_CASE_TRANSFER' },
          { attribute: 'AtrRptDt001', value: ctx.reportDate },
          { attribute: 'AtrSymptDt1', value: ctx.symptomOnsetDate },
          { attribute: 'AtrRptOrg01', value: ctx.orgUnit },
        ],
        events: [
          {
            program: PROGRAM_CASE_ID,
            programStage: STAGE_INVESTIGATION_ID,
            orgUnit: ctx.orgUnit,
            status: 'ACTIVE',
            occurredAt,
            dataValues: [
              { dataElement: 'DeCaseStat1', value: 'NEW' },
              ...(ctx.initialDiagnosisText ? [{ dataElement: 'DeInitDiag', value: ctx.initialDiagnosisText }] : []),
            ],
          },
        ],
      },
    ],
  };
  return dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'CREATE_AND_UPDATE', atomicMode: 'OBJECT', async: 'false' });
}

/**
 * API-11: 标记 Registration 事件已推送（DePushCase1=true，DePushCsId1，DePushCsDt1）
 */
export async function markUnknownRegisterPushed(params: {
  registerEventUid: string;
  enrollmentUid: string;
  orgUnit: string;
  pushedCaseEnrollmentUid: string;
  occurredAt: string; // 使用注册事件原 occurredAt 以满足更新要求
}) {
  const payload = {
    events: [
      {
        event: params.registerEventUid,
        program: PROGRAM_UNKNOWN_ID,
        programStage: STAGE_REGISTER_ID,
        enrollment: params.enrollmentUid,
        orgUnit: params.orgUnit,
        status: 'ACTIVE',
        occurredAt: params.occurredAt,
        dataValues: [
          { dataElement: 'DePushCase1', value: 'true' },
          { dataElement: 'DePushCsId1', value: params.pushedCaseEnrollmentUid },
          { dataElement: 'DePushCsDt1', value: dayjs().toISOString() },
        ],
      },
    ],
  };
  return dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'UPDATE', atomicMode: 'OBJECT', async: 'false' });
}

/**
 * API-12: 更新未知状态为 CONFIRMED（若未设置）
 */
export async function ensureUnknownStatusConfirmed(params: {
  registerEventUid: string;
  enrollmentUid: string;
  orgUnit: string;
  occurredAt: string;
}) {
  const payload = {
    events: [
      {
        event: params.registerEventUid,
        program: PROGRAM_UNKNOWN_ID,
        programStage: STAGE_REGISTER_ID,
        enrollment: params.enrollmentUid,
        orgUnit: params.orgUnit,
        status: 'ACTIVE',
        occurredAt: params.occurredAt,
        dataValues: [{ dataElement: 'DeUnkStat01', value: 'CONFIRMED' }],
      },
    ],
  };
  return dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'UPDATE', atomicMode: 'OBJECT', async: 'false' });
}

/**
 * API-13: 完成未知病例 Enrollment
 */
export async function completeUnknownEnrollment(params: {
  teiUid: string;
  enrollmentUid: string;
  orgUnit: string;
  reportDate: string;
  symptomOnsetDate: string;
}) {
  const payload = {
    enrollments: [
      {
        enrollment: params.enrollmentUid,
        program: PROGRAM_UNKNOWN_ID,
        trackedEntity: params.teiUid,
        orgUnit: params.orgUnit,
        status: 'COMPLETED',
        enrolledAt: dayjs(params.reportDate).toISOString(),
        occurredAt: dayjs(params.symptomOnsetDate).toISOString(),
        completedAt: dayjs().toISOString(),
      },
    ],
  };
  return dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'UPDATE', atomicMode: 'OBJECT', async: 'false' });
}

/**
 * 简单病原体→疾病编码映射（可按需替换为后端配置）。
 * key: DeConfPath1 的 option code, value: OsDiseasCd1 的 option code
 */
export const PATHOGEN_TO_DISEASE_MAP: Record<string, string> = {
  // 示例：OptPathV103 -> OptDiseaB30
  // 请按实际环境调整
  OptPathV103: 'OptDiseaB30',
};

/**
 * 判断是否可显示“推送至个案管理”按钮：
 * 条件：DeUnkStat01 == 'CONFIRMED' 且 DePushCase1 != true
 */
export function canPushToCaseManagement(registerEventDv: Array<{ dataElement: string; value: string }>): boolean {
  const m = new Map(registerEventDv.map((d) => [d.dataElement, String(d.value)]));
  const status = (m.get('DeUnkStat01') || '').toUpperCase();
  const pushed = (m.get('DePushCase1') || '').toLowerCase() === 'true';
  return status === 'CONFIRMED' && !pushed;
}