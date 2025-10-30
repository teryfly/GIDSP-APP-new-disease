import { useCallback, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { loadUnknownCaseDetails, listLabEventsByEnrollment, getEnrollmentChangeLogs, getEventChangeLogs } from '../services/unknownCase/details';
import { canPushToCaseManagement, checkAlreadyEnrolledInProgram1, createProgram1EnrollmentWithInvestigation, markUnknownRegisterPushed, ensureUnknownStatusConfirmed, completeUnknownEnrollment, PATHOGEN_TO_DISEASE_MAP } from '../services/unknownCase/push';

export interface ProgressStep {
  key: string;
  title: string;
  status: 'wait' | 'process' | 'finish' | 'error';
  description?: string;
}

export function useUnknownCaseDetails(teiUid: string) {
  const [header, setHeader] = useState<any>(null);
  const [registerEvent, setRegisterEvent] = useState<any>(null);
  const [labPager, setLabPager] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 10, total: 0 });
  const [labEvents, setLabEvents] = useState<any[]>([]);
  const [pushVisible, setPushVisible] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [loading, setLoading] = useState(false);

  const enrollmentRef = useRef<string | null>(null);
  const orgUnitRef = useRef<string | null>(null);
  const reportDateRef = useRef<string | null>(null);
  const symptDateRef = useRef<string | null>(null);
  const registerOccurredAtRef = useRef<string | null>(null);

  // logs
  const [logs, setLogs] = useState<{ enr: any[]; regEvt: any[] }>({ enr: [], regEvt: [] });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const tei = await loadUnknownCaseDetails(teiUid);
      const enr = (tei.enrollments || []).find((e: any) => e.program === 'PrgUnknown1') || tei.enrollments?.[0];
      if (!enr) throw new Error('未找到该病例的入组信息');
      enrollmentRef.current = enr.enrollment;
      orgUnitRef.current = enr.orgUnit || tei.orgUnit;
      reportDateRef.current = (new Map((enr.attributes || []).map((a: any) => [a.attribute, a.value]))).get('AtrRptDt001') || undefined;
      symptDateRef.current = (new Map((enr.attributes || []).map((a: any) => [a.attribute, a.value]))).get('AtrSymptDt1') || undefined;

      const reg = (enr.events || []).find((ev: any) => ev.programStage === 'PsRegister1');
      setRegisterEvent(reg || null);
      registerOccurredAtRef.current = reg?.occurredAt || dayjs().toISOString();

      const attrs = new Map(tei.attributes.map((a: any) => [a.attribute, a.value]));
      const enrAttrs = new Map((enr.attributes || []).map((a: any) => [a.attribute, a.value]));
      setHeader({
        teiUid: tei.trackedEntity,
        orgUnit: tei.orgUnit,
        enrollment: enr.enrollment,
        caseNo: enrAttrs.get('AtrUnkNo001'),
        fullName: attrs.get('AtrFullNm01'),
        reportDate: enrAttrs.get('AtrRptDt001'),
        symptomOnsetDate: enrAttrs.get('AtrSymptDt1'),
        statusDv: reg?.dataValues || [],
      });

      // labs (page 1)
      const labRes = await listLabEventsByEnrollment(enr.enrollment, 1, labPager.pageSize);
      setLabEvents(labRes.events || []);
      setLabPager({ page: labRes.pager.page, pageSize: labRes.pager.pageSize, total: labRes.pager.total || 0 });
    } finally {
      setLoading(false);
    }
  }, [teiUid, labPager.pageSize]);

  const canPush = useMemo(() => canPushToCaseManagement(header?.statusDv || []), [header]);

  const openPush = () => setPushVisible(true);
  const closePush = () => setPushVisible(false);

  const runPush = useCallback(async () => {
    if (!header || !registerEvent) return;
    const steps: ProgressStep[] = [
      { key: 'validate', title: '数据校验', status: 'process' },
      { key: 'createCase', title: '创建个案记录', status: 'wait' },
      { key: 'markPushed', title: '登记事件标记已推送', status: 'wait' },
      { key: 'ensureConfirmed', title: '更新病例状态为已确诊', status: 'wait' },
      { key: 'completeEnrollment', title: '完成不明病例入组', status: 'wait' },
    ];
    setProgress(steps);

    try {
      // Step 1: validate
      const conflict = await checkAlreadyEnrolledInProgram1(header.teiUid);
      if (conflict.hasConflict) {
        throw new Error(`该人员已存在个案记录（Program1），请勿重复推送。`);
      }
      setProgress((prev) => prev.map((s) => (s.key === 'validate' ? { ...s, status: 'finish' } : s)));

      // 推导病原体→疾病映射（从最新实验室事件的 DeConfPath1）
      const latestLab = labEvents[0];
      const dvMap = new Map((latestLab?.dataValues || []).map((d: any) => [d.dataElement, String(d.value)]));
      const pathogenCode = dvMap.get('DeConfPath1');
      const diseaseCode = (pathogenCode && PATHOGEN_TO_DISEASE_MAP[pathogenCode]) || '';

      // Step 2: create enrollment in Program1
      setProgress((prev) => prev.map((s) => (s.key === 'createCase' ? { ...s, status: 'process' } : s)));
      const res = await createProgram1EnrollmentWithInvestigation({
        teiUid: header.teiUid,
        orgUnit: orgUnitRef.current || header.orgUnit,
        enrollmentUid: header.enrollment,
        reportDate: reportDateRef.current || header.reportDate,
        symptomOnsetDate: symptDateRef.current || header.symptomOnsetDate,
        registerEventUid: registerEvent.event,
        confirmedPathogenCode: pathogenCode,
        confirmedDiseaseCode: diseaseCode,
        initialDiagnosisText: dvMap.get('DeConfDis01') || '不明原因转入个案',
      });
      const newEnrollmentUid = res?.bundleReport?.typeReportMap?.ENROLLMENT?.objectReports?.[0]?.uid || '';
      if (!newEnrollmentUid) throw new Error('创建 Program1 Enrollment 失败');
      setProgress((prev) => prev.map((s) => (s.key === 'createCase' ? { ...s, status: 'finish', description: `enrollment=${newEnrollmentUid}` } : s)));

      // Step 3: mark pushed
      setProgress((prev) => prev.map((s) => (s.key === 'markPushed' ? { ...s, status: 'process' } : s)));
      await markUnknownRegisterPushed({
        registerEventUid: registerEvent.event,
        enrollmentUid: header.enrollment,
        orgUnit: orgUnitRef.current || header.orgUnit,
        pushedCaseEnrollmentUid: newEnrollmentUid,
        occurredAt: registerOccurredAtRef.current || dayjs().toISOString(),
      });
      setProgress((prev) => prev.map((s) => (s.key === 'markPushed' ? { ...s, status: 'finish' } : s)));

      // Step 4: ensure confirmed
      setProgress((prev) => prev.map((s) => (s.key === 'ensureConfirmed' ? { ...s, status: 'process' } : s)));
      await ensureUnknownStatusConfirmed({
        registerEventUid: registerEvent.event,
        enrollmentUid: header.enrollment,
        orgUnit: orgUnitRef.current || header.orgUnit,
        occurredAt: registerOccurredAtRef.current || dayjs().toISOString(),
      });
      setProgress((prev) => prev.map((s) => (s.key === 'ensureConfirmed' ? { ...s, status: 'finish' } : s)));

      // Step 5: complete unknown enrollment
      setProgress((prev) => prev.map((s) => (s.key === 'completeEnrollment' ? { ...s, status: 'process' } : s)));
      await completeUnknownEnrollment({
        teiUid: header.teiUid,
        enrollmentUid: header.enrollment,
        orgUnit: orgUnitRef.current || header.orgUnit,
        reportDate: reportDateRef.current || header.reportDate,
        symptomOnsetDate: symptDateRef.current || header.symptomOnsetDate,
      });
      setProgress((prev) => prev.map((s) => (s.key === 'completeEnrollment' ? { ...s, status: 'finish' } : s)));

      return { ok: true, createdEnrollment: newEnrollmentUid };
    } catch (e: any) {
      setProgress((prev) => {
        const cur = prev.find((p) => p.status === 'process') || prev[prev.length - 1];
        return prev.map((s) => (s.key === cur.key ? { ...s, status: 'error', description: e.message || '错误' } : s));
      });
      return { ok: false, error: e?.message || '推送失败' };
    }
  }, [header, registerEvent, labEvents]);

  const loadLogs = useCallback(async () => {
    if (!enrollmentRef.current || !registerEvent?.event) return;
    const [enr, evt] = await Promise.all([
      getEnrollmentChangeLogs(enrollmentRef.current, 1, 50),
      getEventChangeLogs(registerEvent.event, 1, 50),
    ]);
    setLogs({ enr: enr.changeLogs || [], regEvt: evt.changeLogs || [] });
  }, [registerEvent?.event]);

  return {
    loading,
    header,
    registerEvent,
    labEvents,
    labPager,
    canPush,
    pushVisible,
    progress,
    openPush,
    closePush,
    runPush,
    reload,
    logs,
    loadLogs,
    setLabPager,
  };
}