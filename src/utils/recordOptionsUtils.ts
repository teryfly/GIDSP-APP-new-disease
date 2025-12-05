import { getOptionSetCached } from '../services/caseDetailsService';

// Option set IDs per contract (using actual option set IDs)
// Follow-up
const OS_HEALTH_STATUS_ID = 'OsHlthStat1';  // 健康状态
const OS_TREAT_COMPLIANCE_ID = 'OsTrtCompl1';  // 治疗依从性

// Treatment
const OS_TREAT_TYPE_ID = 'OsTrtType01';  // 治疗类型
const OS_TREAT_OUTCOME_ID = 'OsTrtOutcm1';  // 治疗结果

// Test
const OS_SAMPLE_TYPE_ID = 'OsSampleTp1';  // 样本类型
const OS_TEST_RESULT_ID = 'OsTestRslt1';  // 检测结果
const OS_TEST_STATUS_ID = 'OsTestStat1';  // 检测状态
const OS_TEST_TYPE_ID = 'OsTestType1';    // 检测类型
const OS_PATHOGEN_ID = 'OsPathogen1';     // 病原体

// Tracking
const OS_RISK_ASSESSMENT_ID = 'OsRiskAsmt1';  // 风险评估

// Unknown Case
const OS_UNKNOWN_STATUS_ID = 'OsUnkStat01';  // 不明病例状态

// 缓存变量
let cachedHealthStatus: any = null;
let cachedTreatmentCompliance: any = null;
let cachedTreatmentType: any = null;
let cachedTreatmentOutcome: any = null;
let cachedSampleType: any = null;
let cachedTestResult: any = null;
let cachedTestStatus: any = null;
let cachedTestType: any = null;
let cachedPathogen: any = null;
let cachedRiskAssessment: any = null;
let cachedUnknownStatus: any = null;

/**
 * Load health status option set
 */
export async function loadHealthStatusOS() {
  if (cachedHealthStatus) return cachedHealthStatus;
  cachedHealthStatus = await getOptionSetCached(OS_HEALTH_STATUS_ID);
  return cachedHealthStatus;
}

/**
 * Load treatment compliance option set
 */
export async function loadTreatmentComplianceOS() {
  if (cachedTreatmentCompliance) return cachedTreatmentCompliance;
  cachedTreatmentCompliance = await getOptionSetCached(OS_TREAT_COMPLIANCE_ID);
  return cachedTreatmentCompliance;
}

/**
 * Load treatment type option set
 */
export async function loadTreatmentTypeOS() {
  if (cachedTreatmentType) return cachedTreatmentType;
  cachedTreatmentType = await getOptionSetCached(OS_TREAT_TYPE_ID);
  return cachedTreatmentType;
}

/**
 * Load treatment outcome option set
 */
export async function loadTreatmentOutcomeOS() {
  if (cachedTreatmentOutcome) return cachedTreatmentOutcome;
  cachedTreatmentOutcome = await getOptionSetCached(OS_TREAT_OUTCOME_ID);
  return cachedTreatmentOutcome;
}

/**
 * Load sample type option set
 */
export async function loadSampleTypeOS() {
  if (cachedSampleType) return cachedSampleType;
  cachedSampleType = await getOptionSetCached(OS_SAMPLE_TYPE_ID);
  return cachedSampleType;
}

/**
 * Load test result option set
 */
export async function loadTestResultOS() {
  if (cachedTestResult) return cachedTestResult;
  cachedTestResult = await getOptionSetCached(OS_TEST_RESULT_ID);
  return cachedTestResult;
}

/**
 * Load test status option set
 */
export async function loadTestStatusOS() {
  if (cachedTestStatus) return cachedTestStatus;
  cachedTestStatus = await getOptionSetCached(OS_TEST_STATUS_ID);
  return cachedTestStatus;
}

/**
 * Load test type option set
 */
export async function loadTestTypeOS() {
  if (cachedTestType) return cachedTestType;
  cachedTestType = await getOptionSetCached(OS_TEST_TYPE_ID);
  return cachedTestType;
}

/**
 * Load pathogen option set
 */
export async function loadPathogenOS() {
  if (cachedPathogen) return cachedPathogen;
  cachedPathogen = await getOptionSetCached(OS_PATHOGEN_ID);
  return cachedPathogen;
}

/**
 * Load risk assessment option set
 */
export async function loadRiskAssessmentOS() {
  if (cachedRiskAssessment) return cachedRiskAssessment;
  cachedRiskAssessment = await getOptionSetCached(OS_RISK_ASSESSMENT_ID);
  return cachedRiskAssessment;
}

/**
 * Load unknown case status option set
 */
export async function loadUnknownStatusOS() {
  if (cachedUnknownStatus) return cachedUnknownStatus;
  cachedUnknownStatus = await getOptionSetCached(OS_UNKNOWN_STATUS_ID);
  return cachedUnknownStatus;
}

/**
 * Build a code->name map from an OptionSet
 */
export function buildCodeNameMap(os: any): Map<string, string> {
  const m = new Map<string, string>();
  (os.options || []).forEach((o: any) => m.set(o.code, o.name));
  return m;
}

/**
 * Helper to get Chinese label by code from a provided map
 */
export function toLabel(code?: string, map?: Map<string, string>): string {
  if (!code) return '-';
  return map?.get(code) || code;
}