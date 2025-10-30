import { useEffect, useRef, useState } from 'react';
import { Form, Modal, message } from 'antd';
import dayjs from 'dayjs';
import appConfig from '../../config.json';
import {
  loadOptionSetCached,
  getMeDefaultOu,
  searchPersonByNationalId,
  createCaseNested,
  createOrUpdateEnrollment,
  saveDraftToLocal,
  loadDraftFromLocal,
  clearDraft,
} from '../../services/newCaseService';
import { buildCreatePayload, buildEnrollmentWithEvent, genRandomCaseNo } from '../../services/newCaseBuilder';

const OS_DISEASE_ID = 'OsDiseasCd1';
const OS_CASE_SRC_ID = 'OsCaseSrc01';
const OS_CASE_STAT_ID = 'OsCaseStat1';

export function useNewCase() {
  const [formBasic] = Form.useForm();
  const [formEpi] = Form.useForm();
  const [formDiag] = Form.useForm();

  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);

  const [defaultOu, setDefaultOu] = useState<{ id: string; name: string } | null>(null);
  const [diseaseOpts, setDiseaseOpts] = useState<{ value: string; label: string }[]>([]);
  const [caseSrcOpts, setCaseSrcOpts] = useState<{ value: string; label: string }[]>([]);
  const [caseStatOpts, setCaseStatOpts] = useState<{ value: string; label: string }[]>([]);
  const foundTeiRef = useRef<{ teiUid: string; orgUnit: string } | null>(null);

  // 调试
  const trackerDebug = Boolean((appConfig as any)?.tracker?.debug);
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const teiUidRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ou = await getMeDefaultOu();
        setDefaultOu(ou);
        const disease = await loadOptionSetCached(OS_DISEASE_ID);
        const src = await loadOptionSetCached(OS_CASE_SRC_ID);
        const stat = await loadOptionSetCached(OS_CASE_STAT_ID);
        setDiseaseOpts((disease.options || []).map(o => ({ value: o.code, label: o.name })));
        setCaseSrcOpts((src.options || []).map(o => ({ value: o.code, label: o.name })));
        setCaseStatOpts((stat.options || []).map(o => ({ value: o.code, label: o.name })));
        const nid = (formBasic.getFieldValue('nationalId') || '').trim();
        if (nid) {
          const draft = loadDraftFromLocal(nid);
          if (draft) {
            formBasic.setFieldsValue(draft.basic);
            formEpi.setFieldsValue(draft.epi);
            formDiag.setFieldsValue(draft.diag);
          }
        }
      } catch (e: any) {
        message.error(`加载元数据失败: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidateNationalId = async (id: string) => {
    if (!defaultOu) return;
    try {
      setLoading(true);
      const res = await searchPersonByNationalId(id, defaultOu.id);
      if (res) {
        foundTeiRef.current = { teiUid: res.trackedEntity, orgUnit: res.orgUnit };
        message.warning('系统中已存在该人员，将沿用既有人员进行入组。');
      } else {
        foundTeiRef.current = null;
        message.success('未找到重复人员，可新建。');
      }
    } catch (e: any) {
      message.error(`验证失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    const b = formBasic.getFieldsValue(true);
    const e = formEpi.getFieldsValue(true);
    const d = formDiag.getFieldsValue(true);
    const pack = {
      basic: {
        ...b,
        reportDate: b.reportDate ? b.reportDate.format('YYYY-MM-DD') : undefined,
        symptomOnsetDate: b.symptomOnsetDate ? b.symptomOnsetDate.format('YYYY-MM-DD') : undefined,
      },
      epi: e,
      diag: {
        ...d,
        diagnosisDate: d.diagnosisDate ? d.diagnosisDate.format('YYYY-MM-DD') : undefined,
      },
    };
    if (!pack.basic?.nationalId) {
      message.info('请先填写身份证号再保存草稿');
      return;
    }
    saveDraftToLocal(pack.basic.nationalId, pack);
    message.success('草稿已保存到本地');
  };

  const next = async () => {
    try {
      if (current === 0) await formBasic.validateFields();
      if (current === 1) await formEpi.validateFields();
      if (current === 2) await formDiag.validateFields();
      await saveDraft();
      setCurrent((c) => c + 1);
    } catch {
      message.error('请检查当前步骤的必填项');
    }
  };

  const prev = () => setCurrent((c) => c - 1);

  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消？',
      content: '取消后将丢失未提交的数据（本地草稿除外）。',
      onOk: () => history.back(),
    });
  };

  const handleSubmit = async () => {
    try {
      await formBasic.validateFields();
      await formDiag.validateFields();
      const b = formBasic.getFieldsValue(true);
      const e = formEpi.getFieldsValue(true);
      const d = formDiag.getFieldsValue(true);
      if (!defaultOu) throw new Error('缺少报告机构');

      setLoading(true);
      setLastRequest(null);
      setLastResponse(null);
      teiUidRef.current = null;

      if (!foundTeiRef.current) {
        const payload = buildCreatePayload({
          basic: {
            diseaseCode: b.diseaseCode,
            fullName: b.fullName,
            genderZh: b.genderZh,
            nationalId: b.nationalId,
            age: Number(b.age),
            phone: b.phone,
            addressProvince: b.addressProvince,
            addressCity: b.addressCity,
            addressDistrict: b.addressDistrict,
            addressDetail: b.addressDetail,
            reportOrgId: b.reportOrgId,
            reportUser: b.reportUser,
            reportDate: b.reportDate?.format('YYYY-MM-DD'),
            symptomOnsetDate: b.symptomOnsetDate?.format('YYYY-MM-DD'),
          },
          epi: {
            exposure: e.hasExposure ? e.exposure : undefined,
            contact: e.hasContact ? e.contact : undefined,
            travel: e.hasTravel ? e.travel : undefined,
          },
          diag: {
            initialDiagnosis: d.initialDiagnosis,
            finalDiagnosis: d.finalDiagnosis,
            diagnosisDate: d.diagnosisDate?.format('YYYY-MM-DD'),
            caseSourceCode: d.caseSourceCode,
            caseStatusCode: d.caseStatusCode,
          },
          orgUnitId: defaultOu.id,
        });
        setLastRequest(payload);
        const res = await createCaseNested(payload);
        setLastResponse(res);
        const teiUid = res?.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports?.[0]?.uid || null;
        teiUidRef.current = teiUid;
      } else {
        const body = buildEnrollmentWithEvent({
          teiUid: foundTeiRef.current.teiUid,
          orgUnitId: defaultOu.id,
          basic: {
            diseaseCode: b.diseaseCode,
            fullName: b.fullName,
            genderZh: b.genderZh,
            nationalId: b.nationalId,
            age: Number(b.age),
            phone: b.phone,
            addressProvince: b.addressProvince,
            addressCity: b.addressCity,
            addressDistrict: b.addressDistrict,
            addressDetail: b.addressDetail,
            reportOrgId: b.reportOrgId,
            reportUser: b.reportUser,
            reportDate: b.reportDate?.format('YYYY-MM-DD'),
            symptomOnsetDate: b.symptomOnsetDate?.format('YYYY-MM-DD'),
            caseNo: genRandomCaseNo(),
          },
          epi: {
            exposure: e.hasExposure ? e.exposure : undefined,
            contact: e.hasContact ? e.contact : undefined,
            travel: e.hasTravel ? e.travel : undefined,
          },
          diag: {
            initialDiagnosis: d.initialDiagnosis,
            finalDiagnosis: d.finalDiagnosis,
            diagnosisDate: d.diagnosisDate?.format('YYYY-MM-DD'),
            caseSourceCode: d.caseSourceCode,
            caseStatusCode: d.caseStatusCode,
          },
        });
        setLastRequest(body);
        const res2 = await createOrUpdateEnrollment(body);
        setLastResponse(res2);
        teiUidRef.current = foundTeiRef.current.teiUid;
      }

      if (trackerDebug) {
        // 调试模式：打开调试窗口，不跳转
        setDebugOpen(true);
      } else {
        // 非调试模式：正常流程，自动跳转
        const nid = formBasic.getFieldValue('nationalId');
        if (teiUidRef.current) {
          clearDraft(nid);
          location.assign(`/cases/${teiUidRef.current}`);
        } else {
          message.warning('未解析到 TEI UID，请开启调试模式查看bundleReport');
        }
      }
    } catch (e: any) {
      message.error(e.message || '提交失败，请检查表单数据');
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToDetail = () => {
    if (teiUidRef.current) {
      const nid = formBasic.getFieldValue('nationalId');
      clearDraft(nid);
      location.assign(`/cases/${teiUidRef.current}`);
    } else {
      message.info('未解析到 TEI UID，请先检查错误信息');
    }
  };

  return {
    formBasic,
    formEpi,
    formDiag,
    current,
    loading,
    defaultOu,
    diseaseOpts,
    caseSrcOpts,
    caseStatOpts,
    next,
    prev,
    saveDraft,
    handleCancel,
    handleValidateNationalId,
    handleSubmit,
    debugOpen,
    setDebugOpen,
    lastRequest,
    lastResponse,
    handleJumpToDetail,
  };
}