import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  getCaseDetails,
  getEventChangeLogs,
  getTeiChangeLogs,
  pushToEpiFlag,
  closeCase,
  PROGRAM_STAGE_INVESTIGATION_ID,
  STAGE_FOLLOW_UP,
  STAGE_TREATMENT,
  STAGE_TEST,
  STAGE_TRACKING,
  type TrackerEvent,
} from '../services/caseDetailsService';
import { mapInvestigationToEpiNarrative } from '../services/mappers/eventMappers';
import { mapFollowUps, mapTreatments, mapTests, mapTrackings } from '../services/mappers/eventMappers';
import { geocodeAddress, getCachedGeocode } from '../utils/amapGeocode';
import { getOrgUnitsByPath, getMe } from '../services/caseService2';

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

type TrackingWithGeo = ReturnType<typeof mapTrackings>[number] & {
  latitude?: number;
  longitude?: number;
  geocodePending?: boolean;
  geocodeError?: string | null;
  regionId?: string;
  regionName?: string; // 关联地区中文名称
};

export function useCaseDetails(teiUid: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [header, setHeader] = useState<HeaderSummary | null>(null);
  const [epi, setEpi] = useState<ReturnType<typeof mapInvestigationToEpiNarrative> | null>(null);

  const [followUps, setFollowUps] = useState<ReturnType<typeof mapFollowUps>>([]);
  const [followPager, setFollowPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [treatments, setTreatments] = useState<ReturnType<typeof mapTreatments>>([]);
  const [treatPager, setTreatPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [tests, setTests] = useState<ReturnType<typeof mapTests>>([]);
  const [testPager, setTestPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [trackings, setTrackings] = useState<TrackingWithGeo[]>([]);
  const [trackPager, setTrackPager] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });

  const [logs, setLogs] = useState<{ tei: any[]; event: any[] }>({ tei: [], event: [] });

  const enrollmentRef = useRef<string | null>(null);
  const orgUnitRef = useRef<string | null>(null);
  const investigationEventRef = useRef<string | null>(null);

  const loadHeaderAndEpi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tei = await getCaseDetails(teiUid);

      const teiAttrs = new Map(tei.attributes.map((a) => [a.attribute, a.value]));
      const enrollment = tei.enrollments?.find((enr) => enr.program === 'PrgCaseMgt1') || tei.enrollments?.[0];
      const enrAttrs = new Map((enrollment?.attributes || []).map((a) => [a.attribute, a.value]));
      const investigationEvent = enrollment?.events?.find((ev) => ev.programStage === PROGRAM_STAGE_INVESTIGATION_ID) || enrollment?.events?.[0];

      enrollmentRef.current = enrollment?.enrollment || null;
      orgUnitRef.current = enrollment?.orgUnit || tei.orgUnit || null;
      investigationEventRef.current = investigationEvent?.event || null;

      const epiNarrative = mapInvestigationToEpiNarrative(investigationEvent as unknown as TrackerEvent);
      setEpi(epiNarrative);

      setHeader({
        trackedEntity: tei.trackedEntity,
        orgUnit: tei.orgUnit,
        fullName: teiAttrs.get('AtrFullNm01'),
        genderZh: teiAttrs.get('AtrGender01'),
        age: teiAttrs.get('AtrAge00001'),
        nationalId: teiAttrs.get('AtrNatnlId1'),
        phone: teiAttrs.get('AtrPhone001'),
        address: teiAttrs.get('AtrAddr0001'),
        caseNo: enrAttrs.get('AtrCaseNo01'),
        diseaseCode: enrAttrs.get('AtrDiseaCd1'),
        reportDate: enrAttrs.get('AtrRptDt001'),
        reportOrgName: enrAttrs.get('AtrRptOrg01'),
        symptomOnsetDate: enrAttrs.get('AtrSymptDt1'),
        diagnosisDate: enrAttrs.get('AtrDiagDt01'),
        caseSource: enrAttrs.get('AtrCaseSrc1'),
        statusTag: epiNarrative?.caseStatus || enrollment?.status || 'ACTIVE',
        enrollment: enrollment?.enrollment,
        investigationEvent: investigationEvent?.event,
      });

      const allEvents = enrollment?.events || [];

      const followUpEvents = allEvents.filter(e => e.programStage === STAGE_FOLLOW_UP);
      setFollowUps(mapFollowUps(followUpEvents));
      setFollowPager({ page: 1, pageSize: followUpEvents.length, total: followUpEvents.length });

      const treatmentEvents = allEvents.filter(e => e.programStage === STAGE_TREATMENT);
      setTreatments(mapTreatments(treatmentEvents));
      setTreatPager({ page: 1, pageSize: treatmentEvents.length, total: treatmentEvents.length });

      const testEvents = allEvents.filter(e => e.programStage === STAGE_TEST);
      setTests(mapTests(testEvents));
      setTestPager({ page: 1, pageSize: testEvents.length, total: testEvents.length });

      const trackingEvents = allEvents.filter(e => e.programStage === STAGE_TRACKING);
      const mappedTrackings = mapTrackings(trackingEvents);

      // Build a map of orgUnitId -> name for regionId, to pass as city to geocoder
      let regionNameMap = new Map<string, string>();
      try {
        const me = await getMe();
        const path = me.organisationUnits?.[0]?.path || '';
        const parentPath = path.substring(0, path.lastIndexOf('/')) || path;
        const ous = await getOrgUnitsByPath(parentPath);
        regionNameMap = new Map((ous || []).map((ou) => [ou.id, ou.name]));
      } catch {
        regionNameMap = new Map<string, string>();
      }

      const enriched: TrackingWithGeo[] = await Promise.all(mappedTrackings.map(async (t) => {
        const lat = (t as any).latitude;
        const lng = (t as any).longitude;
        const regionId = (t as any).regionId as string | undefined;
        const regionName = regionId ? regionNameMap.get(regionId) : undefined;

        if (typeof lat === 'number' && typeof lng === 'number') {
          return { ...t, latitude: lat, longitude: lng, regionId, regionName, geocodePending: false, geocodeError: null };
        }
        const addressText = t.location || '';
        const cached = getCachedGeocode(addressText);
        if (cached) {
          return { ...t, latitude: cached.lat, longitude: cached.lng, regionId, regionName, geocodePending: false, geocodeError: null };
        }
        const ll = await geocodeAddress(addressText, regionName); // pass regionName as city
        if (ll) {
          return { ...t, latitude: ll.lat, longitude: ll.lng, regionId, regionName, geocodePending: false, geocodeError: null };
        }
        return { ...t, regionId, regionName, geocodePending: false, geocodeError: '未解析到坐标' };
      }));

      setTrackings(enriched);
      setTrackPager({ page: 1, pageSize: trackingEvents.length, total: trackingEvents.length });
    } catch (e: any) {
      setError(e.message || '加载个案详情失败');
    } finally {
      setLoading(false);
    }
  }, [teiUid]);

  const reloadAll = useCallback(async () => {
    await loadHeaderAndEpi();
  }, [loadHeaderAndEpi]);

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

  const retryGeocodeTracking = useCallback(async (index: number, addressOverride?: string) => {
    let addressToUse = '';
    let regionNameToUse: string | undefined = undefined;

    setTrackings((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      addressToUse = (addressOverride && addressOverride.trim()) || item.location || '';
      regionNameToUse = item.regionName;
      copy[index] = { ...item, geocodePending: true, geocodeError: null };
      return copy;
    });

    try {
      const ll = await geocodeAddress(addressToUse, regionNameToUse);
      setTrackings((prev) => {
        const copy = [...prev];
        const item = copy[index];
        if (!item) return prev;
        if (ll) {
          copy[index] = { ...item, latitude: ll.lat, longitude: ll.lng, geocodePending: false, geocodeError: null };
        } else {
          copy[index] = { ...item, geocodePending: false, geocodeError: '未解析到坐标' };
        }
        return copy;
      });
    } catch (e: any) {
      setTrackings((prev) => {
        const copy = [...prev];
        const item = copy[index];
        if (!item) return prev;
        copy[index] = { ...item, geocodePending: false, geocodeError: e?.message || '解析失败' };
        return copy;
      });
    }
  }, []);

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
    retryGeocodeTracking,
  };
}