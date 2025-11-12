import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  getCaseDetails,
  listStageEvents,
  getEventChangeLogs,
  getTeiChangeLogs,
  pushToEpiFlag,
  closeCase,
  PROGRAM_ID,
  PROGRAM_STAGE_INVESTIGATION_ID,
  STAGE_FOLLOW_UP,
  STAGE_TREATMENT,
  STAGE_TEST,
  STAGE_TRACKING,
  DE_PUSH_EPI,
  DE_PUSH_EPI_DT,
  DE_CASE_STATUS,
  type TrackerEvent,
  type EventsListResponse,
} from '../services/caseDetailsService';
import { mapInvestigationToEpiNarrative } from '../services/mappers/eventMappers';
import { mapFollowUps } from '../services/mappers/eventMappers';
import { mapTreatments } from '../services/mappers/eventMappers';
import { mapTests } from '../services/mappers/eventMappers';
import { mapTrackings } from '../services/mappers/eventMappers';

export interface HeaderSummary {
  trackedEntity: string;
  orgUnit?: string;
  fullName?: string;
  genderZh?: string;
  age?: string;
  nationalId?: string;
  phone?: string;
  address?: string;
  caseNo?: string;
  diseaseCode?: string;
  reportDate?: string;
  reportOrgName?: string;
  symptomOnsetDate?: string;
  diagnosisDate?: string;
  caseSource?: string;
  statusTag?: string;
  enrollment?: string;
  investigationEvent?: string;
}

export interface PagerState {
  page: number;
  pageSize: number;
  total: number;
}

export function useCaseDetails(teiUid: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [header, setHeader] = useState<HeaderSummary | null>(null);
  const [epi, setEpi] = useState<ReturnType<typeof mapInvestigationToEpiNarrative> | null>(null);

  // lists with pagination
  const [followUps, setFollowUps] = useState<ReturnType<typeof mapFollowUps>>([]);
  const [followPager, setFollowPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [treatments, setTreatments] = useState<ReturnType<typeof mapTreatments>>([]);
  const [treatPager, setTreatPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [tests, setTests] = useState<ReturnType<typeof mapTests>>([]);
  const [testPager, setTestPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [trackings, setTrackings] = useState<ReturnType<typeof mapTrackings>>([]);
  const [trackPager, setTrackPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  // logs
  const [logs, setLogs] = useState<{ tei: any[]; event: any[] }>({ tei: [], event: [] });

  const enrollmentRef = useRef<string | null>(null);
  const orgUnitRef = useRef<string | null>(null);
  const investigationEventRef = useRef<string | null>(null);

  const loadHeaderAndEpi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tei = await getCaseDetails(teiUid);
      
      // TEI级别属性
      const teiAttrs = new Map(tei.attributes.map((a) => [a.attribute, a.value]));
      
      // 获取enrollment
      const enrollment = tei.enrollments?.find((enr) => enr.program === 'PrgCaseMgt1') || tei.enrollments?.[0];
      
      // Enrollment级别属性
      const enrAttrs = new Map((enrollment?.attributes || []).map((a) => [a.attribute, a.value]));
      
      // 获取调查事件
      const investigationEvent = enrollment?.events?.find((ev) => ev.programStage === PROGRAM_STAGE_INVESTIGATION_ID) || enrollment?.events?.[0];

      enrollmentRef.current = enrollment?.enrollment || null;
      orgUnitRef.current = enrollment?.orgUnit || tei.orgUnit || null;
      investigationEventRef.current = investigationEvent?.event || null;

      const epiNarrative = mapInvestigationToEpiNarrative(investigationEvent as unknown as TrackerEvent);
      setEpi(epiNarrative);

      // 构建完整的header数据
      setHeader({
        trackedEntity: tei.trackedEntity,
        orgUnit: tei.orgUnit,
        // TEI属性
        fullName: teiAttrs.get('AtrFullNm01'),
        genderZh: teiAttrs.get('AtrGender01'),
        age: teiAttrs.get('AtrAge00001'),
        nationalId: teiAttrs.get('AtrNatnlId1'),
        phone: teiAttrs.get('AtrPhone001'),
        address: teiAttrs.get('AtrAddr0001'),
        // Enrollment属性
        caseNo: enrAttrs.get('AtrCaseNo01'),
        diseaseCode: enrAttrs.get('AtrDiseaCd1'),
        reportDate: enrAttrs.get('AtrRptDt001'),
        reportOrgName: enrAttrs.get('AtrRptOrg01'),
        symptomOnsetDate: enrAttrs.get('AtrSymptDt1'),
        diagnosisDate: enrAttrs.get('AtrDiagDt01'),
        caseSource: enrAttrs.get('AtrCaseSrc1'),
        // 从调查事件获取状态
        statusTag: epiNarrative?.caseStatus || enrollment?.status || 'ACTIVE',
        enrollment: enrollment?.enrollment,
        investigationEvent: investigationEvent?.event,
      });

      // 从enrollment.events中筛选各类记录
      const allEvents = enrollment?.events || [];
      
      // 随访记录 (PsFollowUp1)
      const followUpEvents = allEvents.filter(e => e.programStage === STAGE_FOLLOW_UP);
      const mappedFollowUps = mapFollowUps(followUpEvents);
      setFollowUps(mappedFollowUps);
      setFollowPager({ page: 1, pageSize: followUpEvents.length, total: followUpEvents.length });
      
      // 治疗记录 (PsTreatmnt1)
      const treatmentEvents = allEvents.filter(e => e.programStage === STAGE_TREATMENT);
      const mappedTreatments = mapTreatments(treatmentEvents);
      setTreatments(mappedTreatments);
      setTreatPager({ page: 1, pageSize: treatmentEvents.length, total: treatmentEvents.length });
      
      // 检测记录 (PsTest00001)
      const testEvents = allEvents.filter(e => e.programStage === STAGE_TEST);
      const mappedTests = mapTests(testEvents);
      setTests(mappedTests);
      setTestPager({ page: 1, pageSize: testEvents.length, total: testEvents.length });
      
      // 追踪记录 (PsTracking1)
      const trackingEvents = allEvents.filter(e => e.programStage === STAGE_TRACKING);
      const mappedTrackings = mapTrackings(trackingEvents);
      setTrackings(mappedTrackings);
      setTrackPager({ page: 1, pageSize: trackingEvents.length, total: trackingEvents.length });
    } catch (e: any) {
      setError(e.message || '加载个案详情失败');
    } finally {
      setLoading(false);
    }
  }, [teiUid]);

  const reloadAll = useCallback(async () => {
    await loadHeaderAndEpi();
    // 删除分页加载调用，因为数据已经在loadHeaderAndEpi中加载
    // await Promise.allSettled([loadFollowUps(1), loadTreatments(1), loadTests(1), loadTrackings(1)]);
  }, [loadHeaderAndEpi/*, loadFollowUps, loadTreatments, loadTests, loadTrackings*/]);

  const loadLogs = useCallback(async () => {
    if (!header?.trackedEntity) return;
    const teiLogs = await getTeiChangeLogs(header.trackedEntity, 1, 50);
    const invEventUid = investigationEventRef.current;
    let evtLogs: any[] = [];
    if (invEventUid) {
      const res = await getEventChangeLogs(invEventUid, 1, 50);
      evtLogs = res.changeLogs || [];
    }
    setLogs({ tei: teiLogs.changeLogs || [], event: evtLogs });
  }, [header?.trackedEntity]);

  const doPushEpi = useCallback(async () => {
    if (!enrollmentRef.current || !orgUnitRef.current || !investigationEventRef.current) throw new Error('缺少必要上下文');
    const now = dayjs().toISOString();
    await pushToEpiFlag({
      investigationEventUid: investigationEventRef.current,
      enrollment: enrollmentRef.current,
      orgUnit: orgUnitRef.current,
      occurredAt: now,
    });
    await loadHeaderAndEpi();
  }, [loadHeaderAndEpi]);

  const doCloseCase = useCallback(async () => {
    if (!enrollmentRef.current || !orgUnitRef.current || !investigationEventRef.current) throw new Error('缺少必要上下文');
    const now = dayjs().toISOString();
    await closeCase({
      investigationEventUid: investigationEventRef.current,
      enrollment: enrollmentRef.current,
      orgUnit: orgUnitRef.current,
      occurredAt: now,
    });
    await loadHeaderAndEpi();
  }, [loadHeaderAndEpi]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  return {
    loading,
    error,
    header,
    epi,
    followUps,
    followPager,
    treatments,
    treatPager,
    tests,
    testPager,
    trackings,
    trackPager,
    logs,
    reloadAll,
    loadLogs,
    doPushEpi,
    doCloseCase,
  };
};
