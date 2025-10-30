import type { TrackerEvent } from '../caseDetailsService';
import {
  DE_EXPOSURE_HISTORY,
  DE_CONTACT_HISTORY,
  DE_TRAVEL_HISTORY,
  DE_CASE_STATUS,
  DE_PUSH_EPI,
} from '../caseDetailsConsts';

// 通用工具
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

export function mapInvestigationToEpiNarrative(event?: TrackerEvent | null): InvestigationNarrative | null {
  if (!event) return null;
  const m = dvMap(event);
  return {
    caseStatus: m.get(DE_CASE_STATUS),
    exposureHistory: m.get(DE_EXPOSURE_HISTORY),
    contactHistory: m.get(DE_CONTACT_HISTORY),
    travelHistory: m.get(DE_TRAVEL_HISTORY),
    pushEpi: (m.get(DE_PUSH_EPI) || '').toLowerCase() === 'true',
    occurredAt: event.occurredAt,
    event: event.event,
  };
}

// 随访记录映射
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

export function mapFollowUps(events: TrackerEvent[], codeMap?: Record<string, string>): FollowUpItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const item: FollowUpItem = {
      event: e.event,
      occurredAt: e.occurredAt,
      method: m.get('DeFlwUpMthd'),
      doctor: m.get('DeDoctor001') || m.get('DeFlwDoctor'),
      healthStatus: m.get('DeHlthStat1'),
      temperature: m.get('DeTemp00001'),
      symptoms: m.get('DeSymptoms1'),
      treatmentCompliance: m.get('DeTrtCompl1'),
      nextFollowUpDate: m.get('DeNxtFlwDt1'),
      notes: m.get('DeNotes0001'),
      status: e.status,
    };
    if (codeMap) {
      if (item.healthStatus && codeMap[item.healthStatus]) item.healthStatus = codeMap[item.healthStatus];
      if (item.method && codeMap[item.method]) item.method = codeMap[item.method];
      if (item.treatmentCompliance && codeMap[item.treatmentCompliance]) item.treatmentCompliance = codeMap[item.treatmentCompliance];
    }
    return item;
  });
}

// 治疗记录映射
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

export function mapTreatments(events: TrackerEvent[], codeMap?: Record<string, string>): TreatmentItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const item: TreatmentItem = {
      event: e.event,
      occurredAt: e.occurredAt,
      type: m.get('DeTrtType001'),
      hospital: m.get('DeHospital1'),
      department: m.get('DeDept00001'),
      doctor: m.get('DeDoctor001'),
      diagnosis: m.get('DeDiag00001'),
      plan: m.get('DePlan00001'),
      outcome: m.get('DeOutcome01'),
      dischargeDate: m.get('DeDischrgDt'),
      status: e.status,
    };
    if (codeMap) {
      if (item.type && codeMap[item.type]) item.type = codeMap[item.type];
      if (item.outcome && codeMap[item.outcome]) item.outcome = codeMap[item.outcome];
    }
    return item;
  });
}

// 检测记录映射
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

export function mapTests(events: TrackerEvent[], codeMap?: Record<string, string>): TestItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const item: TestItem = {
      event: e.event,
      occurredAt: e.occurredAt,
      testNo: m.get('DeTestNo001'),
      sampleCollectionDate: m.get('DeSmplColDt'),
      sampleType: m.get('DeSmplType1'),
      testType: m.get('DeTestType1'),
      result: m.get('DeTestRslt1'),
      pathogen: m.get('DePathog001'),
      lab: m.get('DeLabName01'),
      testStatus: m.get('DeTestStat1'),
      isPushedToLab: (m.get('DePushToLab') || '').toLowerCase() === 'true',
      status: e.status,
    };
    if (codeMap) {
      ['sampleType', 'testType', 'result', 'testStatus'].forEach((k) => {
        const key = k as keyof TestItem;
        const val = item[key] as string | undefined;
        if (val && codeMap[val]) (item as any)[key] = codeMap[val];
      });
    }
    return item;
  });
}

// 追踪记录映射
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
  status: TrackerEvent['status'];
}

export function mapTrackings(events: TrackerEvent[], codeMap?: Record<string, string>): TrackingItem[] {
  return events.map((e) => {
    const m = dvMap(e);
    const item: TrackingItem = {
      event: e.event,
      occurredAt: e.occurredAt,
      type: m.get('DeTrackType'),
      location: m.get('DeLocation1'),
      description: m.get('DeExpoDetails'),
      startDate: m.get('DeStartDate'),
      endDate: m.get('DeEndDate'),
      riskAssessment: m.get('DeRiskAssess'),
      longitude: m.get('DeLng') ? Number(m.get('DeLng')) : undefined,
      latitude: m.get('DeLat') ? Number(m.get('DeLat')) : undefined,
      status: e.status,
    };
    if (codeMap && item.riskAssessment && codeMap[item.riskAssessment]) {
      item.riskAssessment = codeMap[item.riskAssessment];
    }
    return item;
  });
}