import { dhis2Client } from '../api/dhis2Client';
import { PROGRAM_ID } from './caseDetailsService';
import { PS, DE_FOLLOWUP, DE_TREAT, DE_TEST, DE_TRACK, writeDV } from './contractMapping';

export interface CreateEventParams {
  enrollment: string;
  programStage: string;
  orgUnit: string;
  occurredAt: string;
  dataValues: Array<{ dataElement: string; value: string | null }>;
}

export interface UpdateEventParams extends CreateEventParams {
  event: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'SCHEDULE';
}

export interface ImportReport {
  status: 'OK' | 'ERROR' | 'WARNING';
  stats: { created: number; updated: number; deleted: number; ignored: number; total: number };
  bundleReport?: any;
}

async function postTracker(body: any, params: Record<string, string>): Promise<ImportReport> {
  return dhis2Client.post<ImportReport>('/api/tracker', body, params);
}

export async function createEvent(params: CreateEventParams): Promise<ImportReport> {
  const payload = {
    events: [
      {
        program: PROGRAM_ID,
        programStage: params.programStage,
        enrollment: params.enrollment,
        orgUnit: params.orgUnit,
        status: 'ACTIVE' as const,
        occurredAt: params.occurredAt,
        dataValues: params.dataValues,
      },
    ],
  };
  return postTracker(payload, { importStrategy: 'CREATE', atomicMode: 'OBJECT' });
}

export async function updateEvent(params: UpdateEventParams): Promise<ImportReport> {
  const payload = {
    events: [
      {
        event: params.event,
        program: PROGRAM_ID,
        programStage: params.programStage,
        enrollment: params.enrollment,
        orgUnit: params.orgUnit,
        status: params.status || 'ACTIVE',
        occurredAt: params.occurredAt,
        dataValues: params.dataValues,
      },
    ],
  };
  return postTracker(payload, { importStrategy: 'UPDATE', atomicMode: 'OBJECT' });
}

// Follow-up
export interface FollowUpEventData {
  followUpMethod: string;
  doctor?: string;
  healthStatus: string;
  temperature?: string;
  symptoms?: string;
  treatmentCompliance: string;
  nextFollowUpDate?: string;
  notes?: string;
}

export async function createFollowUpEvent(
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: FollowUpEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_FOLLOWUP.METHOD), value: data.followUpMethod },
    { dataElement: writeDV(DE_FOLLOWUP.HEALTH_STATUS), value: data.healthStatus },
    { dataElement: writeDV(DE_FOLLOWUP.TREAT_COMPLIANCE), value: data.treatmentCompliance },
  ];
  if (data.doctor) dvs.push({ dataElement: writeDV(DE_TREAT.DOCTOR), value: data.doctor });
  if (data.temperature) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.TEMP), value: data.temperature });
  if (data.symptoms) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.SYMPTOMS), value: data.symptoms });
  if (data.nextFollowUpDate) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.NEXT_DATE), value: data.nextFollowUpDate });
  if (data.notes) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.REMARKS), value: data.notes });

  return createEvent({
    enrollment,
    programStage: PS.FOLLOW_UP,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

export async function updateFollowUpEvent(
  event: string,
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: FollowUpEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_FOLLOWUP.METHOD), value: data.followUpMethod },
    { dataElement: writeDV(DE_FOLLOWUP.HEALTH_STATUS), value: data.healthStatus },
    { dataElement: writeDV(DE_FOLLOWUP.TREAT_COMPLIANCE), value: data.treatmentCompliance },
  ];
  if (data.doctor) dvs.push({ dataElement: writeDV(DE_TREAT.DOCTOR), value: data.doctor });
  if (data.temperature) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.TEMP), value: data.temperature });
  if (data.symptoms) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.SYMPTOMS), value: data.symptoms });
  if (data.nextFollowUpDate) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.NEXT_DATE), value: data.nextFollowUpDate });
  if (data.notes) dvs.push({ dataElement: writeDV(DE_FOLLOWUP.REMARKS), value: data.notes });

  return updateEvent({
    event,
    enrollment,
    programStage: PS.FOLLOW_UP,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

// Treatment
export interface TreatmentEventData {
  type: string;
  hospital: string;
  department?: string;
  doctor?: string;
  diagnosis: string;
  plan: string;
  medications?: string;
  outcome?: string;
  dischargeDate?: string;
}

export async function createTreatmentEvent(
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TreatmentEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TREAT.TYPE), value: data.type },
    { dataElement: writeDV(DE_TREAT.HOSPITAL), value: data.hospital },
    { dataElement: writeDV(DE_TREAT.DIAGNOSIS), value: data.diagnosis },
    { dataElement: writeDV(DE_TREAT.PLAN), value: data.plan },
  ];
  if (data.department) dvs.push({ dataElement: writeDV(DE_TREAT.DEPT), value: data.department });
  if (data.doctor) dvs.push({ dataElement: writeDV(DE_TREAT.DOCTOR), value: data.doctor });
  if (data.medications) dvs.push({ dataElement: writeDV(DE_TREAT.MEDS), value: data.medications });
  if (data.outcome) dvs.push({ dataElement: writeDV(DE_TREAT.OUTCOME), value: data.outcome });
  if (data.dischargeDate) dvs.push({ dataElement: writeDV(DE_TREAT.DISCHARGE_DT), value: data.dischargeDate });

  return createEvent({
    enrollment,
    programStage: PS.TREATMENT,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

export async function updateTreatmentEvent(
  event: string,
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TreatmentEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TREAT.TYPE), value: data.type },
    { dataElement: writeDV(DE_TREAT.HOSPITAL), value: data.hospital },
    { dataElement: writeDV(DE_TREAT.DIAGNOSIS), value: data.diagnosis },
    { dataElement: writeDV(DE_TREAT.PLAN), value: data.plan },
  ];
  if (data.department) dvs.push({ dataElement: writeDV(DE_TREAT.DEPT), value: data.department });
  if (data.doctor) dvs.push({ dataElement: writeDV(DE_TREAT.DOCTOR), value: data.doctor });
  if (data.medications) dvs.push({ dataElement: writeDV(DE_TREAT.MEDS), value: data.medications });
  if (data.outcome) dvs.push({ dataElement: writeDV(DE_TREAT.OUTCOME), value: data.outcome });
  if (data.dischargeDate) dvs.push({ dataElement: writeDV(DE_TREAT.DISCHARGE_DT), value: data.dischargeDate });

  return updateEvent({
    event,
    enrollment,
    programStage: PS.TREATMENT,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

// Test
export interface TestEventData {
  testNo: string;
  sampleCollectionDate: string;
  sampleType: string;
  testType: string;
  lab: string;
  testDate?: string;
  result?: string;
  resultDetails?: string;
  pathogen?: string;
  testStatus: string;
}

export async function createTestEvent(
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TestEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TEST.TEST_NO), value: data.testNo },
    { dataElement: writeDV(DE_TEST.SAMPLE_DATE), value: data.sampleCollectionDate },
    { dataElement: writeDV(DE_TEST.SAMPLE_TYPE), value: data.sampleType },
    { dataElement: writeDV(DE_TEST.TEST_TYPE), value: data.testType },
    { dataElement: writeDV(DE_TEST.ORG_NAME), value: data.lab },
    { dataElement: writeDV(DE_TEST.STATUS), value: data.testStatus },
  ];
  if (data.testDate) dvs.push({ dataElement: writeDV(DE_TEST.TEST_DATE), value: data.testDate });
  if (data.result) dvs.push({ dataElement: writeDV(DE_TEST.RESULT), value: data.result });
  if (data.resultDetails) dvs.push({ dataElement: writeDV(DE_TEST.RESULT_DETAIL), value: data.resultDetails });
  if (data.pathogen) dvs.push({ dataElement: writeDV(DE_TEST.PATHOGEN), value: data.pathogen });

  return createEvent({
    enrollment,
    programStage: PS.TEST,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

export async function updateTestEvent(
  event: string,
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TestEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TEST.TEST_NO), value: data.testNo },
    { dataElement: writeDV(DE_TEST.SAMPLE_DATE), value: data.sampleCollectionDate },
    { dataElement: writeDV(DE_TEST.SAMPLE_TYPE), value: data.sampleType },
    { dataElement: writeDV(DE_TEST.TEST_TYPE), value: data.testType },
    { dataElement: writeDV(DE_TEST.ORG_NAME), value: data.lab },
    { dataElement: writeDV(DE_TEST.STATUS), value: data.testStatus },
  ];
  if (data.testDate) dvs.push({ dataElement: writeDV(DE_TEST.TEST_DATE), value: data.testDate });
  if (data.result) dvs.push({ dataElement: writeDV(DE_TEST.RESULT), value: data.result });
  if (data.resultDetails) dvs.push({ dataElement: writeDV(DE_TEST.RESULT_DETAIL), value: data.resultDetails });
  if (data.pathogen) dvs.push({ dataElement: writeDV(DE_TEST.PATHOGEN), value: data.pathogen });

  return updateEvent({
    event,
    enrollment,
    programStage: PS.TEST,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

// Tracking
export interface TrackingEventData {
  type: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  riskAssessment: string;
  longitude?: number;
  latitude?: number;
  contactPersons?: string;
  regionId?: string;
}

export async function createTrackingEvent(
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TrackingEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TRACK.TYPE), value: data.type },
    { dataElement: writeDV(DE_TRACK.START), value: data.startDate },
    { dataElement: writeDV(DE_TRACK.END), value: data.endDate },
    { dataElement: writeDV(DE_TRACK.LOC_DESC), value: data.location },
    { dataElement: writeDV(DE_TRACK.EXPOSURE_DETAIL), value: data.description },
    { dataElement: writeDV(DE_TRACK.RISK_ASSESS), value: data.riskAssessment },
  ];
  if (data.regionId) dvs.push({ dataElement: writeDV(DE_TRACK.REGION), value: data.regionId });
  if (data.longitude !== undefined) dvs.push({ dataElement: writeDV((DE_TRACK as any)['longitude'] || { id: 'DeLng' } as any), value: String(data.longitude) });
  if (data.latitude !== undefined) dvs.push({ dataElement: writeDV((DE_TRACK as any)['latitude'] || { id: 'DeLat' } as any), value: String(data.latitude) });
  if (data.contactPersons) dvs.push({ dataElement: writeDV(DE_TRACK.CONTACT_PERSONS), value: data.contactPersons });

  return createEvent({
    enrollment,
    programStage: PS.TRACKING,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}

export async function updateTrackingEvent(
  event: string,
  enrollment: string,
  orgUnit: string,
  occurredAt: string,
  data: TrackingEventData
): Promise<ImportReport> {
  const dvs: Array<{ dataElement: string; value: string | null }> = [
    { dataElement: writeDV(DE_TRACK.TYPE), value: data.type },
    { dataElement: writeDV(DE_TRACK.START), value: data.startDate },
    { dataElement: writeDV(DE_TRACK.END), value: data.endDate },
    { dataElement: writeDV(DE_TRACK.LOC_DESC), value: data.location },
    { dataElement: writeDV(DE_TRACK.EXPOSURE_DETAIL), value: data.description },
    { dataElement: writeDV(DE_TRACK.RISK_ASSESS), value: data.riskAssessment },
  ];
  if (data.regionId) dvs.push({ dataElement: writeDV(DE_TRACK.REGION), value: data.regionId });
  if (data.longitude !== undefined) dvs.push({ dataElement: writeDV((DE_TRACK as any)['longitude'] || { id: 'DeLng' } as any), value: String(data.longitude) });
  if (data.latitude !== undefined) dvs.push({ dataElement: writeDV((DE_TRACK as any)['latitude'] || { id: 'DeLat' } as any), value: String(data.latitude) });
  if (data.contactPersons) dvs.push({ dataElement: writeDV(DE_TRACK.CONTACT_PERSONS), value: data.contactPersons });

  return updateEvent({
    event,
    enrollment,
    programStage: PS.TRACKING,
    orgUnit,
    occurredAt,
    dataValues: dvs,
  });
}