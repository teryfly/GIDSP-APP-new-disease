import type { TrackerEvent } from '../caseDetailsService';
import { DE_INVEST, DE_FOLLOWUP, DE_TREAT, DE_TEST, DE_TRACK, readDV } from '../contractMapping';

function dvMap(event: TrackerEvent): Map<string, string> {
  return new Map((event.dataValues || []).map((dv) => [dv.dataElement, String(dv.value)]));
}

export interface InvestigationNarrative {
  caseStatus?: string;
  exposureHistory?: string;
  contactHistory?: string;
  travelHistory?: string;
  pushEpi?: boolean;
  occurredAt?: string;
  event?: string;
}

export function mapInvestigationToEpiNarrative(event?: TrackerEvent | null) {
  if (!event) return null;
  const m = dvMap(event);
  const push = readDV(m, DE_INVEST.PUSH_EPI);
  return {
    caseStatus: readDV(m, DE_INVEST.CASE_STATUS),
    exposureHistory: readDV(m, DE_INVEST.EXPO_HIST),
    contactHistory: readDV(m, DE_INVEST.CONT_HIST),
    travelHistory: readDV(m, DE_INVEST.TRAVEL_HIST),
    pushEpi: (push || '').toLowerCase() === 'true',
    occurredAt: event.occurredAt,
    event: event.event,
  };
}

export interface FollowUpItem {
  event: string;
  occurredAt: string;
  method?: string;
  doctor?: string;
  healthStatus?: string;
  temperature?: string;
  symptoms?: string;
  treatmentCompliance?: string;
  nextFollowUpDate?: string;
  notes?: string;
  status: TrackerEvent['status'];
}

export function mapFollowUps(events: TrackerEvent[]): FollowUpItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    return {
      event: e.event,
      occurredAt: e.occurredAt,
      method: readDV(m, DE_FOLLOWUP.METHOD),
      doctor: readDV(m, DE_TREAT.DOCTOR),
      healthStatus: readDV(m, DE_FOLLOWUP.HEALTH_STATUS),
      temperature: readDV(m, DE_FOLLOWUP.TEMP),
      symptoms: readDV(m, DE_FOLLOWUP.SYMPTOMS),
      treatmentCompliance: readDV(m, DE_FOLLOWUP.TREAT_COMPLIANCE),
      nextFollowUpDate: readDV(m, DE_FOLLOWUP.NEXT_DATE),
      notes: readDV(m, DE_FOLLOWUP.REMARKS),
      status: e.status,
    };
  });
}

export interface TreatmentItem {
  event: string;
  occurredAt: string;
  type?: string;
  hospital?: string;
  department?: string;
  doctor?: string;
  diagnosis?: string;
  plan?: string;
  outcome?: string;
  dischargeDate?: string;
  status: TrackerEvent['status'];
}

export function mapTreatments(events: TrackerEvent[]): TreatmentItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    return {
      event: e.event,
      occurredAt: e.occurredAt,
      type: readDV(m, DE_TREAT.TYPE),
      hospital: readDV(m, DE_TREAT.HOSPITAL),
      department: readDV(m, DE_TREAT.DEPT),
      doctor: readDV(m, DE_TREAT.DOCTOR),
      diagnosis: readDV(m, DE_TREAT.DIAGNOSIS),
      plan: readDV(m, DE_TREAT.PLAN),
      outcome: readDV(m, DE_TREAT.OUTCOME),
      dischargeDate: readDV(m, DE_TREAT.DISCHARGE_DT),
      status: e.status,
    };
  });
}

export interface TestItem {
  event: string;
  occurredAt: string;
  testNo?: string;
  sampleCollectionDate?: string;
  sampleType?: string;
  testType?: string;
  result?: string;
  pathogen?: string;
  lab?: string;
  testStatus?: string;
  isPushedToLab?: boolean;
  status: TrackerEvent['status'];
}

export function mapTests(events: TrackerEvent[]): TestItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const pushed = readDV(m, DE_TEST.PUSH_LAB);
    return {
      event: e.event,
      occurredAt: e.occurredAt,
      testNo: readDV(m, DE_TEST.TEST_NO),
      sampleCollectionDate: readDV(m, DE_TEST.SAMPLE_DATE),
      sampleType: readDV(m, DE_TEST.SAMPLE_TYPE),
      testType: readDV(m, DE_TEST.TEST_TYPE),
      result: readDV(m, DE_TEST.RESULT),
      pathogen: readDV(m, DE_TEST.PATHOGEN),
      lab: readDV(m, DE_TEST.ORG_NAME),
      testStatus: readDV(m, DE_TEST.STATUS),
      isPushedToLab: (pushed || '').toLowerCase() === 'true',
      status: e.status,
    };
  });
}

export interface TrackingItem {
  event: string;
  occurredAt: string;
  type?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  riskAssessment?: string;
  longitude?: number;
  latitude?: number;
  regionId?: string;
  status: TrackerEvent['status'];
}

export function mapTrackings(events: TrackerEvent[]): TrackingItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const lng = m.get('DeLng');
    const lat = m.get('DeLat');
    return {
      event: e.event,
      occurredAt: e.occurredAt,
      type: readDV(m, DE_TRACK.TYPE),
      location: readDV(m, DE_TRACK.LOC_DESC),
      description: readDV(m, DE_TRACK.EXPOSURE_DETAIL),
      startDate: readDV(m, DE_TRACK.START),
      endDate: readDV(m, DE_TRACK.END),
      riskAssessment: readDV(m, DE_TRACK.RISK_ASSESS),
      longitude: lng ? Number(lng) : undefined,
      latitude: lat ? Number(lat) : undefined,
      regionId: readDV(m, DE_TRACK.REGION),
      status: e.status,
    };
  });
}