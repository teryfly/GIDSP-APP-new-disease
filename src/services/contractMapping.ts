// 统一维护《API Contract – 随访/治疗/检测/追踪记录》中的programStage与dataElement UID
// 并提供读取兼容工具：优先合同UID，兼容历史旧UID

// Program Stages per Contract
export const PS = {
  FOLLOW_UP: 'PsFollowUp1',
  TREATMENT: 'PsTreatmnt1',
  TEST: 'PsTest00001',
  TRACKING: 'PsTracking1',
  INVESTIGATION: 'PsInvestig1',
} as const;

// Follow-up data elements (Contract) and legacy aliases
export const DE_FOLLOWUP = {
  METHOD: { id: 'DeFlwUpMthd', legacy: ['DeFlwUpMthd'] },
  HEALTH_STATUS: { id: 'DeHlthStat1', legacy: ['DeHlthStat1'] },
  TEMP: { id: 'DeTemp00001', legacy: ['DeTemp00001'] },
  SYMPTOMS: { id: 'DeSymptoms1', legacy: ['DeSymptoms1'] },
  TREAT_COMPLIANCE: { id: 'DeTrtCompl1', legacy: ['DeTrtCompl1'] },
  NEXT_DATE: { id: 'DeNxtFlwDt1', legacy: ['DeNxtFlwDt1'] },
  REMARKS: { id: 'DeRemarks01', legacy: ['DeNotes0001', 'DeRemarks01'] }, // 兼容旧字段
} as const;

// Treatment data elements (Contract) and legacy aliases
export const DE_TREAT = {
  TYPE: { id: 'DeTrtType01', legacy: ['DeTrtType001'] },
  HOSPITAL: { id: 'DeHospNm001', legacy: ['DeHospital1'] },
  DEPT: { id: 'DeDeptNm001', legacy: ['DeDept00001'] },
  DOCTOR: { id: 'DeDocNm0001', legacy: ['DeDoctor001'] },
  DIAGNOSIS: { id: 'DeDiagnos01', legacy: ['DeDiag00001'] },
  PLAN: { id: 'DeTrtPlan01', legacy: ['DePlan00001'] },
  MEDS: { id: 'DeMedicat01', legacy: ['DeMeds00001'] },
  OUTCOME: { id: 'DeTrtOutcm1', legacy: ['DeOutcome01'] },
  DISCHARGE_DT: { id: 'DeDiscDt001', legacy: ['DeDischrgDt'] },
} as const;

// Test data elements (Contract) and legacy aliases
export const DE_TEST = {
  TEST_NO: { id: 'DeTestNo001', legacy: ['DeTestNo001'] },
  SAMPLE_DATE: { id: 'DeSmplColDt', legacy: ['DeSmplColDt'] },
  SAMPLE_TYPE: { id: 'DeSmplType1', legacy: ['DeSmplType1'] },
  TEST_TYPE: { id: 'DeTestType1', legacy: ['DeTestType1'] },
  ORG_NAME: { id: 'DeTestOrg01', legacy: ['DeLabName01'] },
  TEST_DATE: { id: 'DeTestDt001', legacy: ['DeTestDate1'] },
  RESULT: { id: 'DeTestRslt1', legacy: ['DeTestRslt1'] },
  RESULT_DETAIL: { id: 'DeRsltDtl01', legacy: ['DeRsltDtls1'] },
  PATHOGEN: { id: 'DePathogen1', legacy: ['DePathog001'] },
  STATUS: { id: 'DeTestStat1', legacy: ['DeTestStat1'] },
  PUSH_LAB: { id: 'DePushLab01', legacy: ['DePushToLab'] },
  PUSH_LAB_DT: { id: 'DePushLabDt', legacy: [] },
  LAB_RPT_URL: { id: 'DeLabRptUrl', legacy: [] },
} as const;

// Tracking data elements (Contract) and legacy aliases
export const DE_TRACK = {
  TYPE: { id: 'DeTrackTp01', legacy: ['DeTrackType'] },
  START: { id: 'DeStartDt01', legacy: ['DeStartDate'] },
  END: { id: 'DeEndDt0001', legacy: ['DeEndDate'] },
  LOC_DESC: { id: 'DeLocDesc01', legacy: ['DeLocation1'] },
  REGION: { id: 'DeRelRgn001', legacy: [] },
  CONTACT_PERSONS: { id: 'DeContPrsn1', legacy: ['DeContPers1'] },
  EXPOSURE_DETAIL: { id: 'DeExpDtl001', legacy: ['DeExpoDetails'] },
  RISK_ASSESS: { id: 'DeRiskAsmt1', legacy: ['DeRiskAssess'] },
  PUSH_EPI: { id: 'DeTrkPshEpi', legacy: [] },
  PUSH_EPI_DT: { id: 'DeTrkPshDt1', legacy: [] },
} as const;

// Investigation stage elements used elsewhere
export const DE_INVEST = {
  CASE_STATUS: { id: 'DeCaseStat1', legacy: ['DeCaseStat1'] },
  EXPO_HIST: { id: 'DeExposHst1', legacy: ['DeExposHst1'] },
  CONT_HIST: { id: 'DeContHst01', legacy: ['DeContHst01'] },
  TRAVEL_HIST: { id: 'DeTravHst01', legacy: ['DeTravHst01'] },
  PUSH_EPI: { id: 'DePushEpi01', legacy: ['DePushEpi01'] },
  PUSH_EPI_DT: { id: 'DePushEpiDt', legacy: ['DePushEpiDt'] },
} as const;

// 工具: 从事件dataValues中读取值，按合同UID优先，若无则尝试legacy列表
export function readDV(map: Map<string, string>, def: { id: string; legacy: string[] }): string | undefined {
  if (map.has(def.id)) return map.get(def.id);
  for (const k of def.legacy) {
    if (map.has(k)) return map.get(k);
  }
  return undefined;
}

// 写入时一律使用合同UID
export function writeDV(def: { id: string }): string {
  return def.id;
}