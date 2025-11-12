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
        
        // Auto-load draft if national ID exists
        const nid = (formBasic.getFieldValue('nationalId') || '').trim();
        if (nid) {
          const draft = loadDraftFromLocal(nid);
          if (draft) {
            formBasic.setFieldsValue({
              ...draft.basic,
              reportDate: draft.basic.reportDate ? dayjs(draft.basic.reportDate) : undefined,
              symptomOnsetDate: draft.basic.symptomOnsetDate ? dayjs(draft.basic.symptomOnsetDate) : undefined,
              dob: draft.basic.dob ? dayjs(draft.basic.dob) : undefined,
            });
            formEpi.setFieldsValue(draft.epi);
            formDiag.setFieldsValue({
              ...draft.diag,
              diagnosisDate: draft.diag.diagnosisDate ? dayjs(draft.diag.diagnosisDate) : undefined,
            });
            message.info('已加载本地草稿');
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
    if (!defaultOu) {
      message.warning('缺少报告机构信息');
      return;
    }
    try {
      setLoading(true);
      const res = await searchPersonByNationalId(id, defaultOu.id);
      if (res) {
        foundTeiRef.current = { teiUid: res.trackedEntity, orgUnit: res.orgUnit };
        Modal.info({
          title: '检测到重复人员',
          content: `系统中已存在身份证号为 ${id} 的人员记录（TEI: ${res.trackedEntity}）。提交时将沿用既有人员进行入组，不会创建新的人员记录。`,
          okText: '知道了',
        });
      } else {
        foundTeiRef.current = null;
        message.success('未找到重复人员，可新建人员记录。');
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
        dob: b.dob ? b.dob.format('YYYY-MM-DD') : undefined,
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
  };

  const next = async () => {
    try {
      if (current === 0) await formBasic.validateFields();
      if (current === 1) await formEpi.validateFields();
      if (current === 2) await formDiag.validateFields();
      
      // Auto-save draft on step change
      await saveDraft();
      message.success('草稿已自动保存');
      
      setCurrent((c) => c + 1);
    } catch {
      message.error('请检查当前步骤的必填项');
    }
  };

  const prev = () => setCurrent((c) => c - 1);

  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消？',
      content: '取消后将返回个案列表，未提交的数据将丢失（已保存的本地草稿除外）。',
      okText: '确认取消',
      cancelText: '继续填写',
      onOk: () => {
        window.location.href = '/cases';
      },
    });
  };

  const parseImportErrors = (response: any): string[] => {
    const errors: string[] = [];
    const typeReports = response?.bundleReport?.typeReportMap || {};
    
    Object.entries(typeReports).forEach(([type, report]: [string, any]) => {
      const objReports = report?.objectReports || [];
      objReports.forEach((obj: any) => {
        const errorReports = obj?.errorReports || [];
        errorReports.forEach((err: any) => {
          errors.push(`[${type}] ${err.errorCode || 'ERROR'}: ${err.message}`);
        });
      });
    });
    
    return errors;
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

      let response: any;
      let payload: any;

      if (!foundTeiRef.current) {
        payload = buildCreatePayload({
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
          orgUnitId: defaultOu.id,
        });
        setLastRequest(payload);
        response = await createCaseNested(payload);
        setLastResponse(response);
        const teiUid = response?.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports?.[0]?.uid || null;
        teiUidRef.current = teiUid;
      } else {
        payload = buildEnrollmentWithEvent({
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
        setLastRequest(payload);
        response = await createOrUpdateEnrollment(payload);
        setLastResponse(response);
        teiUidRef.current = foundTeiRef.current.teiUid;
      }

      const errors = parseImportErrors(response);
      
      if (response.status !== 'OK' || errors.length > 0) {
        if (trackerDebug) {
          setDebugOpen(true);
          message.error('提交过程中出现错误，请查看调试信息');
        } else {
          const errorMsg = errors.length > 0 ? errors.join('\n') : '提交失败，请检查数据';
          Modal.error({
            title: '提交失败',
            content: errorMsg,
            width: 600,
          });
        }
        return;
      }

      if (trackerDebug) {
        setDebugOpen(true);
        message.success('提交成功，可查看调试信息或跳转到详情页');
      } else {
        const nid = formBasic.getFieldValue('nationalId');
        if (teiUidRef.current) {
          clearDraft(nid);
          message.success('个案创建成功，正在跳转...');
          setTimeout(() => {
            window.location.href = `/cases/${teiUidRef.current}`;
          }, 500);
        } else {
          message.warning('未解析到 TEI UID，请联系管理员');
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
      window.location.href = `/cases/${teiUidRef.current}`;
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