import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  getCaseDetails,
  listStageEvents,
  getEventChangeLogs,
  getTeiChangeLogs,
  pushToEpiFlag,
  closeCase,
  STAGE_FOLLOW_UP,
  STAGE_TREATMENT,
  STAGE_TEST,
  STAGE_TRACKING,
  PROGRAM_STAGE_INVESTIGATION_ID,
  type TrackerEvent,
  type EventsListResponse,
} from '../services/caseDetailsService';
import { mapInvestigationToEpiNarrative, mapFollowUps, mapTreatments, mapTests, mapTrackings } from '../services/mappers/eventMappers';

export interface HeaderSummary {
  trackedEntity: string;
  orgUnit: string;
  caseNo?: string;
  fullName?: string;
  genderZh?: string;
  age?: string;
  nationalId?: string;
  phone?: string;
  address?: string;
  diseaseCode?: string;
  diseaseName?: string;
  reportDate?: string;
  reportOrgName?: string;
  symptomOnsetDate?: string;
  diagnosisDate?: string;
  initialDiagnosis?: string;
  finalDiagnosis?: string;
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
    } catch (e: any) {
      setError(e.message || '加载个案详情失败');
    } finally {
      setLoading(false);
    }
  }, [teiUid]);

  const loadPaged = useCallback(
    async (stage: string, page: number, pageSize: number): Promise<EventsListResponse> => {
      if (!enrollmentRef.current) throw new Error('缺少入组ID');
      return listStageEvents({
        enrollment: enrollmentRef.current,
        programStage: stage,
        page,
        pageSize,
        order: 'occurredAt:desc',
      });
    },
    [],
  );

  const loadFollowUps = useCallback(async (nextPage = 1) => {
    const res = await loadPaged(STAGE_FOLLOW_UP, nextPage, followPager.pageSize);
    const mapped = mapFollowUps(res.events);
    setFollowUps((prev) => (nextPage === 1 ? mapped : prev.concat(mapped)));
    setFollowPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total || 0 });
  }, [loadPaged, followPager.pageSize]);

  const loadTreatments = useCallback(async (nextPage = 1) => {
    const res = await loadPaged(STAGE_TREATMENT, nextPage, treatPager.pageSize);
    const mapped = mapTreatments(res.events);
    setTreatments((prev) => (nextPage === 1 ? mapped : prev.concat(mapped)));
    setTreatPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total || 0 });
  }, [loadPaged, treatPager.pageSize]);

  const loadTests = useCallback(async (nextPage = 1) => {
    const res = await loadPaged(STAGE_TEST, nextPage, testPager.pageSize);
    const mapped = mapTests(res.events);
    setTests((prev) => (nextPage === 1 ? mapped : prev.concat(mapped)));
    setTestPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total || 0 });
  }, [loadPaged, testPager.pageSize]);

  const loadTrackings = useCallback(async (nextPage = 1) => {
    const res = await loadPaged(STAGE_TRACKING, nextPage, trackPager.pageSize);
    const mapped = mapTrackings(res.events);
    setTrackings((prev) => (nextPage === 1 ? mapped : prev.concat(mapped)));
    setTrackPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total || 0 });
  }, [loadPaged, trackPager.pageSize]);

  const reloadAll = useCallback(async () => {
    await loadHeaderAndEpi();
    await Promise.allSettled([loadFollowUps(1), loadTreatments(1), loadTests(1), loadTrackings(1)]);
  }, [loadHeaderAndEpi, loadFollowUps, loadTreatments, loadTests, loadTrackings]);

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
    loadFollowUps,
    loadTreatments,
    loadTests,
    loadTrackings,
    loadLogs,
    doPushEpi,
    doCloseCase,
  };
}