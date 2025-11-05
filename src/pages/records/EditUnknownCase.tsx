import { useState, useEffect, useRef } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import UnknownCaseForm from '../../components/forms/UnknownCaseForm';
import type { UnknownCaseFormData } from '../../types/forms';
import dayjs from 'dayjs';
import appConfig from '../../config.json';
import SubmitDebugger from '../../components/NewCase/SubmitDebugger';
import { dhis2Client } from '../../api/dhis2Client';
import { loadUnknownCaseDetails } from '../../services/unknownCase/details';
import {
  PROGRAM_UNKNOWN_ID,
  STAGE_REGISTER_ID,
  ATR_FULL_NAME,
  ATR_NATIONAL_ID,
  ATR_RPT_DATE,
  ATR_RPT_ORG,
  ATR_UNK_NO,
  ATR_UNK_SYMPT,
  ATR_UNK_PATHOGEN,
} from '../../services/unknownCase/constants';
const { Title } = Typography;
const EditUnknownCase = () => {
  const [form] = Form.useForm<UnknownCaseFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const trackerDebug = Boolean((appConfig as any)?.tracker?.debug);
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const enrollmentRef = useRef<string | null>(null);
  const registerEventRef = useRef<any>(null);
  const orgUnitRef = useRef<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!id) {
        message.error('缺少病例ID');
        navigate('/unknown-cases');
        return;
      }
      setLoading(true);
      try {
        const tei = await loadUnknownCaseDetails(id);
        const enr = (tei.enrollments || [])[0];
        if (!enr) {
          message.error('未找到该病例的入组信息');
          navigate('/unknown-cases');
          return;
        }
        enrollmentRef.current = enr.enrollment;
        orgUnitRef.current = enr.orgUnit || tei.orgUnit;
        const reg = (enr.events || []).find((e: any) => e.programStage === STAGE_REGISTER_ID);
        registerEventRef.current = reg;
        const teiAttrs = new Map((tei.attributes || []).map((a: any) => [a.attribute, a.value]));
        const enrAttrs = new Map((enr.attributes || []).map((a: any) => [a.attribute, a.value]));
        form.setFieldsValue({
          patientName: teiAttrs.get(ATR_FULL_NAME) || '',
          gender: '未知',
          idCardNo: teiAttrs.get(ATR_NATIONAL_ID) || '',
          age: teiAttrs.get('AtrAge00001') ? Number(teiAttrs.get('AtrAge00001')) : undefined,
          phone: teiAttrs.get('AtrPhone001') || '',
          address: teiAttrs.get('AtrAddr0001') || '',
          reportOrgId: enrAttrs.get(ATR_RPT_ORG) || orgUnitRef.current || '',
          reportUserId: '当前用户',
          reportDate: enrAttrs.get(ATR_RPT_DATE) ? dayjs(enrAttrs.get(ATR_RPT_DATE)) : dayjs(),
          symptomOnsetDate: enr.occurredAt ? dayjs(enr.occurredAt) : dayjs(),
          clinicalSymptoms: enrAttrs.get(ATR_UNK_SYMPT) || '',
          suspectedPathogen: enrAttrs.get(ATR_UNK_PATHOGEN) || '',
          urgencyLevel: '中',
        });
      } catch (e: any) {
        message.error(`加载失败: ${e.message}`);
        navigate('/unknown-cases');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, form]);
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
    if (!id || !enrollmentRef.current || !orgUnitRef.current || !registerEventRef.current) {
      message.error('缺少必要上下文');
      return;
    }
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      const payload = {
        // 更新 TEI 属性（姓名、身份证、电话、住址）
        trackedEntities: [
          {
            trackedEntity: id,
            trackedEntityType: 'TetPerson01',
            orgUnit: orgUnitRef.current,
            attributes: [
              { attribute: ATR_FULL_NAME, value: v.patientName },
              ...(v.idCardNo ? [{ attribute: ATR_NATIONAL_ID, value: v.idCardNo }] : []),
              ...(v.phone ? [{ attribute: 'AtrPhone001', value: v.phone }] : []),
              ...(v.address ? [{ attribute: 'AtrAddr0001', value: v.address }] : []),
            ],
          },
        ],
        // 更新 Enrollment 属性（报告日期、报告单位、临床症状、疑似病原体）
        enrollments: [
          {
            enrollment: enrollmentRef.current,
            program: PROGRAM_UNKNOWN_ID,
            orgUnit: orgUnitRef.current,
            attributes: [
              { attribute: ATR_RPT_DATE, value: v.reportDate?.format('YYYY-MM-DD') },
              { attribute: ATR_RPT_ORG, value: v.reportOrgId || orgUnitRef.current },
              ...(v.clinicalSymptoms ? [{ attribute: ATR_UNK_SYMPT, value: v.clinicalSymptoms }] : []),
              ...(v.suspectedPathogen ? [{ attribute: ATR_UNK_PATHOGEN, value: v.suspectedPathogen }] : []),
            ],
          },
        ],
        // 更新 Registration 事件（occurredAt 可保持原值）
        events: [
          {
            event: registerEventRef.current.event,
            program: PROGRAM_UNKNOWN_ID,
            programStage: STAGE_REGISTER_ID,
            enrollment: enrollmentRef.current,
            orgUnit: orgUnitRef.current,
            status: 'ACTIVE',
            occurredAt: registerEventRef.current.occurredAt || dayjs(v.reportDate).toISOString(),
            dataValues: [
              // 此处根据需要更新登记事件 DE（暂无更多字段要求则不更新）
            ],
          },
        ],
      };
      setLastRequest(payload);
      const res = await dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'CREATE_AND_UPDATE', atomicMode: 'OBJECT', async: 'false' });
      setLastResponse(res);
      const errors = parseImportErrors(res);
      if (res.status !== 'OK' || errors.length > 0) {
        if (trackerDebug) {
          setDebugOpen(true);
          message.error('保存过程中出现问题，请查看调试信息');
        } else {
          const errorMsg = errors.length > 0 ? errors.join('\n') : '保存失败，请检查数据';
          Modal.error({ title: '保存失败', content: errorMsg, width: 600 });
        }
        return;
      }
      if (trackerDebug) {
        setDebugOpen(true);
        message.success('保存成功，可查看调试信息或返回详情');
      } else {
        message.success('保存成功，正在返回详情...');
        navigate(`/unknown-cases/${id}`);
      }
    } catch (e: any) {
      message.error(e?.message || '请检查表单填写项。');
    } finally {
      setSubmitting(false);
    }
  };
  const handleCancel = () => {
    if (id) navigate(`/unknown-cases/${id}`);
    else navigate('/unknown-cases');
  };
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑不明原因病例</Title>
      </Card>
      <UnknownCaseForm form={form} />
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>保存</Button>
        </Space>
      </div>
      <SubmitDebugger
        open={debugOpen}
        onClose={() => setDebugOpen(false)}
        lastRequest={lastRequest}
        lastResponse={lastResponse}
        title="同步导入结果（不明原因病例编辑-调试）"
      />
    </Space>
  );
};
export default EditUnknownCase;