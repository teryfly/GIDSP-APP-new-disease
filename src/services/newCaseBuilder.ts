import dayjs from 'dayjs';
import {
  PROGRAM_ID,
  PROGRAM_STAGE_INVESTIGATION_ID,
} from './caseDetailsService';
import {
  ATR_FULL_NAME,
  ATR_NATIONAL_ID,
  ATR_GENDER,
  ATR_AGE,
  ATR_PHONE,
  ATR_ADDRESS,
  ATR_DISEASE_CODE,
  ATR_RPT_ORG,
  ATR_RPT_DATE,
  ATR_SYMPT_DT,
  ATR_DIAG_DT,
  ATR_CASE_SRC,
  DE_CASE_STATUS,
  DE_EXPOSURE,
  DE_CONTACT,
  DE_TRAVEL,
  mapGenderToCode,
} from './newCaseService';

export interface BasicInfoForm {
  diseaseCode: string;
  fullName: string;
  genderZh: '男' | '女' | '未知';
  nationalId: string;
  dob?: string;
  age?: number;
  phone?: string;
  addressProvince?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressDetail?: string;
  reportOrgId: string;
  reportUser?: string;
  reportDate: string; // YYYY-MM-DD
  symptomOnsetDate: string; // YYYY-MM-DD
  caseNo?: string; // 可选：个案编号（当后端要求必填时提供）
}
export interface EpiForm {
  exposure?: string;
  contact?: string;
  travel?: string;
}
export interface DiagnosisForm {
  initialDiagnosis?: string;
  finalDiagnosis?: string;
  diagnosisDate?: string;
  caseSourceCode: string;
  caseStatusCode?: string;
}

/**
 * Enrollment attributes（支持可选包含个案编号 AtrCaseNo01）
 */
function buildEnrollmentAttributes(basic: BasicInfoForm, diag: DiagnosisForm) {
  const attrs: Array<{ attribute: string; value: string }> = [
    { attribute: ATR_DISEASE_CODE, value: basic.diseaseCode },
    { attribute: ATR_RPT_ORG, value: basic.reportOrgId },
    { attribute: ATR_RPT_DATE, value: basic.reportDate },
    { attribute: ATR_SYMPT_DT, value: basic.symptomOnsetDate },
    { attribute: ATR_CASE_SRC, value: diag.caseSourceCode },
  ];
  if (diag.diagnosisDate) attrs.push({ attribute: ATR_DIAG_DT, value: diag.diagnosisDate });
  // 可选注入个案编号（解决 E1018 场景）
  if (basic.caseNo) attrs.push({ attribute: 'AtrCaseNo01', value: basic.caseNo });
  return attrs;
}

function buildTeiAttributes(basic: BasicInfoForm) {
  const fullAddress = [basic.addressProvince, basic.addressCity, basic.addressDistrict, basic.addressDetail]
    .filter(Boolean).join(' ');
  const attrs: Array<{ attribute: string; value: string }> = [
    { attribute: ATR_FULL_NAME, value: basic.fullName },
    { attribute: ATR_NATIONAL_ID, value: basic.nationalId },
    { attribute: ATR_GENDER, value: mapGenderToCode(basic.genderZh) },
    { attribute: ATR_ADDRESS, value: fullAddress || '' },
  ];
  if (typeof basic.age === 'number' && !Number.isNaN(basic.age)) attrs.push({ attribute: ATR_AGE, value: String(basic.age) });
  if (basic.phone) attrs.push({ attribute: ATR_PHONE, value: basic.phone });
  return attrs;
}

function buildInvestigationDataValues(epi: EpiForm, diag: DiagnosisForm) {
  const dvs: Array<{ dataElement: string; value: string }> = [];
  if (diag.caseStatusCode) dvs.push({ dataElement: DE_CASE_STATUS, value: diag.caseStatusCode });
  if (epi.exposure) dvs.push({ dataElement: DE_EXPOSURE, value: epi.exposure });
  if (epi.contact) dvs.push({ dataElement: DE_CONTACT, value: epi.contact });
  if (epi.travel) dvs.push({ dataElement: DE_TRAVEL, value: epi.travel });
  return dvs;
}

/**
 * 场景A：API-05 新建 TEI + Enrollment + Investigation 事件
 * 注意：如果 Enrollment 层 AtrCaseNo01 为必填，调用方应在 basic.caseNo 传入随机编号以满足 E1018。
 */
export function buildCreatePayload(params: {
  basic: BasicInfoForm;
  epi: EpiForm;
  diag: DiagnosisForm;
  orgUnitId: string;
}) {
  const { basic, epi, diag, orgUnitId } = params;
  const enrolledAt = dayjs(basic.reportDate).toISOString();
  const incidentAt = dayjs(basic.symptomOnsetDate).toISOString();
  const eventOccurredAt = dayjs().toISOString();

  return {
    trackedEntities: [
      {
        orgUnit: orgUnitId,
        trackedEntityType: 'TetPerson01',
        attributes: buildTeiAttributes(basic),
        enrollments: [
          {
            program: PROGRAM_ID,
            orgUnit: orgUnitId,
            status: 'ACTIVE',
            enrolledAt,
            occurredAt: incidentAt,
            attributes: buildEnrollmentAttributes(basic, diag),
            events: [
              {
                program: PROGRAM_ID,
                programStage: PROGRAM_STAGE_INVESTIGATION_ID,
                orgUnit: orgUnitId,
                status: 'ACTIVE',
                occurredAt: eventOccurredAt,
                dataValues: buildInvestigationDataValues(epi, diag),
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * 场景B：API-06 Enrollment + 事件（已有 TEI）
 */
export function buildEnrollmentWithEvent(params: {
  teiUid: string;
  orgUnitId: string;
  basic: BasicInfoForm;
  epi: EpiForm;
  diag: DiagnosisForm;
}) {
  const { teiUid, orgUnitId, basic, epi, diag } = params;
  return {
    enrollments: [
      {
        program: PROGRAM_ID,
        trackedEntity: teiUid,
        orgUnit: orgUnitId,
        status: 'ACTIVE',
        enrolledAt: dayjs(basic.reportDate).toISOString(),
        occurredAt: dayjs(basic.symptomOnsetDate).toISOString(),
        attributes: buildEnrollmentAttributes(basic, diag),
        events: [
          {
            program: PROGRAM_ID,
            programStage: PROGRAM_STAGE_INVESTIGATION_ID,
            orgUnit: orgUnitId,
            status: 'ACTIVE',
            occurredAt: dayjs().toISOString(),
            dataValues: buildInvestigationDataValues(epi, diag),
          },
        ],
      },
    ],
  };
}

/**
 * 场景C：仅 Enrollment（已有 TEI，且事件后续创建）
 */
export function buildEnrollmentOnly(params: {
  teiUid: string;
  orgUnitId: string;
  basic: BasicInfoForm;
  diag: DiagnosisForm;
}) {
  const { teiUid, orgUnitId, basic, diag } = params;
  return {
    enrollments: [
      {
        program: PROGRAM_ID,
        trackedEntity: teiUid,
        orgUnit: orgUnitId,
        status: 'ACTIVE',
        enrolledAt: dayjs(basic.reportDate).toISOString(),
        occurredAt: dayjs(basic.symptomOnsetDate).toISOString(),
        attributes: buildEnrollmentAttributes(basic, diag),
      },
    ],
  };
}

/**
 * 生成随机个案编号（用于 E1018 必填兜底）
 */
export function genRandomCaseNo() {
  return `CASE-${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}