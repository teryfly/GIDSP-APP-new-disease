import dayjs from 'dayjs';
import { DE_FOLLOWUP, DE_TREAT, DE_TEST, DE_TRACK, writeDV } from '../contractMapping';

type DV = { dataElement: string; value: string | null };

// internal helper
function toMap(dvs?: Array<{ dataElement: string; value: any }>): Map<string, string> {
  return new Map((dvs || []).map((d) => [d.dataElement, String(d.value)]));
}

/**
 * Follow-up
 */
export function toFollowUpForm(dvs: Array<{ dataElement: string; value: any }>) {
  const m = toMap(dvs);
  return {
    followUpMethod: m.get(DE_FOLLOWUP.METHOD.id),
    healthStatus: m.get(DE_FOLLOWUP.HEALTH_STATUS.id),
    temperature: m.get(DE_FOLLOWUP.TEMP.id) ? Number(m.get(DE_FOLLOWUP.TEMP.id)) : undefined,
    symptoms: m.get(DE_FOLLOWUP.SYMPTOMS.id),
    treatmentCompliance: m.get(DE_FOLLOWUP.TREAT_COMPLIANCE.id),
    nextFollowUpDate: m.get(DE_FOLLOWUP.NEXT_DATE.id) ? dayjs(m.get(DE_FOLLOWUP.NEXT_DATE.id)) : undefined,
    remarks: m.get(DE_FOLLOWUP.REMARKS.id),
  };
}

export function buildFollowUpUpdateDVs(data: {
  followUpMethod?: string;
  healthStatus?: string;
  temperature?: number | null;
  symptoms?: string;
  treatmentCompliance?: string;
  nextFollowUpDate?: string | null; // YYYY-MM-DD
  remarks?: string;
}): DV[] {
  const out: DV[] = [];
  if (data.followUpMethod !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.METHOD), value: data.followUpMethod || null });
  if (data.healthStatus !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.HEALTH_STATUS), value: data.healthStatus || null });
  if (data.treatmentCompliance !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.TREAT_COMPLIANCE), value: data.treatmentCompliance || null });
  if (data.temperature !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.TEMP), value: data.temperature !== undefined && data.temperature !== null ? String(data.temperature) : null });
  if (data.symptoms !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.SYMPTOMS), value: data.symptoms || null });
  if (data.nextFollowUpDate !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.NEXT_DATE), value: data.nextFollowUpDate || null });
  if (data.remarks !== undefined) out.push({ dataElement: writeDV(DE_FOLLOWUP.REMARKS), value: data.remarks || null });
  return out;
}

/**
 * Treatment
 */
export function toTreatmentForm(dvs: Array<{ dataElement: string; value: any }>) {
  const m = toMap(dvs);
  return {
    treatmentType: m.get(DE_TREAT.TYPE.id),
    hospitalName: m.get(DE_TREAT.HOSPITAL.id),
    departmentName: m.get(DE_TREAT.DEPT.id),
    doctorName: m.get(DE_TREAT.DOCTOR.id),
    diagnosis: m.get(DE_TREAT.DIAGNOSIS.id),
    treatmentPlan: m.get(DE_TREAT.PLAN.id),
    medications: m.get(DE_TREAT.MEDS.id),
    treatmentOutcome: m.get(DE_TREAT.OUTCOME.id),
    dischargeDate: m.get(DE_TREAT.DISCHARGE_DT.id) ? dayjs(m.get(DE_TREAT.DISCHARGE_DT.id)) : undefined,
  };
}

export function buildTreatmentUpdateDVs(data: {
  treatmentType?: string;
  hospitalName?: string;
  departmentName?: string;
  doctorName?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  medications?: string;
  treatmentOutcome?: string;
  dischargeDate?: string; // YYYY-MM-DD | undefined
}): DV[] {
  const out: DV[] = [];
  if (data.treatmentType) out.push({ dataElement: writeDV(DE_TREAT.TYPE), value: data.treatmentType });
  if (data.hospitalName) out.push({ dataElement: writeDV(DE_TREAT.HOSPITAL), value: data.hospitalName });
  if (data.departmentName !== undefined) out.push({ dataElement: writeDV(DE_TREAT.DEPT), value: data.departmentName || null });
  if (data.doctorName !== undefined) out.push({ dataElement: writeDV(DE_TREAT.DOCTOR), value: data.doctorName || null });
  if (data.diagnosis) out.push({ dataElement: writeDV(DE_TREAT.DIAGNOSIS), value: data.diagnosis });
  if (data.treatmentPlan !== undefined) out.push({ dataElement: writeDV(DE_TREAT.PLAN), value: data.treatmentPlan || null });
  if (data.medications !== undefined) out.push({ dataElement: writeDV(DE_TREAT.MEDS), value: data.medications || null });
  if (data.treatmentOutcome !== undefined) out.push({ dataElement: writeDV(DE_TREAT.OUTCOME), value: data.treatmentOutcome || null });
  if (data.dischargeDate !== undefined) out.push({ dataElement: writeDV(DE_TREAT.DISCHARGE_DT), value: data.dischargeDate || null });
  return out;
}

/**
 * Test
 */
export function toTestForm(dvs: Array<{ dataElement: string; value: any }>) {
  const m = toMap(dvs);
  return {
    testNo: m.get(DE_TEST.TEST_NO.id),
    sampleCollectionDate: m.get(DE_TEST.SAMPLE_DATE.id) ? dayjs(m.get(DE_TEST.SAMPLE_DATE.id)) : undefined,
    sampleType: m.get(DE_TEST.SAMPLE_TYPE.id),
    testType: m.get(DE_TEST.TEST_TYPE.id),
    testOrgName: m.get(DE_TEST.ORG_NAME.id),
    testDate: m.get(DE_TEST.TEST_DATE.id) ? dayjs(m.get(DE_TEST.TEST_DATE.id)) : undefined,
    testResult: m.get(DE_TEST.RESULT.id),
    pathogenDetected: m.get(DE_TEST.PATHOGEN.id),
    resultDetails: m.get(DE_TEST.RESULT_DETAIL.id),
    testStatus: m.get(DE_TEST.STATUS.id),
    pushLab: m.get(DE_TEST.PUSH_LAB.id),
    pushLabDateTime: m.get(DE_TEST.PUSH_LAB_DT.id),
    labReportUrl: m.get(DE_TEST.LAB_RPT_URL.id),
  };
}

export function buildTestUpdateDVs(data: {
  testNo?: string;
  sampleCollectionDate?: string;
  sampleType?: string;
  testType?: string;
  testOrgName?: string;
  testDate?: string;
  testResult?: string;
  pathogenDetected?: string;
  resultDetails?: string;
  testStatus?: string;
  pushLab?: boolean;
  pushLabDateTime?: string; // ISO
  labReportUrl?: string;
}): DV[] {
  const out: DV[] = [];
  if (data.testNo) out.push({ dataElement: writeDV(DE_TEST.TEST_NO), value: data.testNo });
  if (data.sampleCollectionDate) out.push({ dataElement: writeDV(DE_TEST.SAMPLE_DATE), value: data.sampleCollectionDate });
  if (data.sampleType) out.push({ dataElement: writeDV(DE_TEST.SAMPLE_TYPE), value: data.sampleType });
  if (data.testType) out.push({ dataElement: writeDV(DE_TEST.TEST_TYPE), value: data.testType });
  if (data.testOrgName !== undefined) out.push({ dataElement: writeDV(DE_TEST.ORG_NAME), value: data.testOrgName || null });
  if (data.testDate !== undefined) out.push({ dataElement: writeDV(DE_TEST.TEST_DATE), value: data.testDate || null });
  if (data.testResult !== undefined) out.push({ dataElement: writeDV(DE_TEST.RESULT), value: data.testResult || null });
  if (data.pathogenDetected !== undefined) out.push({ dataElement: writeDV(DE_TEST.PATHOGEN), value: data.pathogenDetected || null });
  if (data.resultDetails !== undefined) out.push({ dataElement: writeDV(DE_TEST.RESULT_DETAIL), value: data.resultDetails || null });
  if (data.testStatus) out.push({ dataElement: writeDV(DE_TEST.STATUS), value: data.testStatus });
  if (data.pushLab !== undefined) out.push({ dataElement: writeDV(DE_TEST.PUSH_LAB), value: String(data.pushLab) });
  if (data.pushLabDateTime !== undefined) out.push({ dataElement: writeDV(DE_TEST.PUSH_LAB_DT), value: data.pushLabDateTime || null });
  if (data.labReportUrl !== undefined) out.push({ dataElement: writeDV(DE_TEST.LAB_RPT_URL), value: data.labReportUrl || null });
  return out;
}

/**
 * Tracking
 */
export function toTrackingForm(dvs: Array<{ dataElement: string; value: any }>) {
  const m = toMap(dvs);
  return {
    trackingType: m.get(DE_TRACK.TYPE.id),
    startDate: m.get(DE_TRACK.START.id) ? dayjs(m.get(DE_TRACK.START.id)) : undefined,
    endDate: m.get(DE_TRACK.END.id) ? dayjs(m.get(DE_TRACK.END.id)) : undefined,
    regionId: m.get(DE_TRACK.REGION.id),
    locationDescription: m.get(DE_TRACK.LOC_DESC.id),
    contactPersons: m.get(DE_TRACK.CONTACT_PERSONS.id),
    exposureDetails: m.get(DE_TRACK.EXPOSURE_DETAIL.id),
    riskAssessment: m.get(DE_TRACK.RISK_ASSESS.id),
    pushedToEpi: m.get(DE_TRACK.PUSH_EPI.id),
    pushEpiDateTime: m.get(DE_TRACK.PUSH_EPI_DT.id),
  };
}

export function buildTrackingUpdateDVs(data: {
  trackingType?: string;
  startDate?: string;
  endDate?: string;
  regionId?: string;
  locationDescription?: string;
  contactPersons?: string;
  exposureDetails?: string;
  riskAssessment?: string;
  pushedToEpi?: boolean;
  pushEpiDateTime?: string; // ISO
}): DV[] {
  const out: DV[] = [];
  if (data.trackingType) out.push({ dataElement: writeDV(DE_TRACK.TYPE), value: data.trackingType });
  if (data.startDate) out.push({ dataElement: writeDV(DE_TRACK.START), value: data.startDate });
  if (data.endDate) out.push({ dataElement: writeDV(DE_TRACK.END), value: data.endDate });
  if (data.locationDescription !== undefined) out.push({ dataElement: writeDV(DE_TRACK.LOC_DESC), value: data.locationDescription || null });
  if (data.regionId !== undefined) out.push({ dataElement: writeDV(DE_TRACK.REGION), value: data.regionId || null });
  if (data.contactPersons !== undefined) out.push({ dataElement: writeDV(DE_TRACK.CONTACT_PERSONS), value: data.contactPersons || null });
  if (data.exposureDetails !== undefined) out.push({ dataElement: writeDV(DE_TRACK.EXPOSURE_DETAIL), value: data.exposureDetails || null });
  if (data.riskAssessment !== undefined) out.push({ dataElement: writeDV(DE_TRACK.RISK_ASSESS), value: data.riskAssessment || null });
  if (data.pushedToEpi !== undefined) out.push({ dataElement: writeDV(DE_TRACK.PUSH_EPI), value: String(data.pushedToEpi) });
  if (data.pushEpiDateTime !== undefined) out.push({ dataElement: writeDV(DE_TRACK.PUSH_EPI_DT), value: data.pushEpiDateTime || null });
  return out;
}