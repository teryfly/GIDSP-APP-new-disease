import { useState } from 'react';
import { Form, Button, Space, message, Modal, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import UnknownCaseForm from '../../components/forms/UnknownCaseForm';
import type { UnknownCaseFormData } from '../../types/forms';
import dayjs from 'dayjs';
import appConfig from '../../config.json';
import SubmitDebugger from '../../components/NewCase/SubmitDebugger';
import { dhis2Client } from '../../api/dhis2Client';
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
const NewUnknownCase = () => {
  const [form] = Form.useForm<UnknownCaseFormData>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  // 调试模式（复用全局 tracker.debug）
  const trackerDebug = Boolean((appConfig as any)?.tracker?.debug);
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [createdTeiUid, setCreatedTeiUid] = useState<string | null>(null);
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
      const values = await form.validateFields();
      setSubmitting(true);
      const reportDate = values.reportDate?.format('YYYY-MM-DD');
      const symptomOnset = values.symptomOnsetDate?.format('YYYY-MM-DD');
      // 注意：orgUnit 应当为 OU ID，这里沿用表单的报告单位字段（若为名称，需在表单组件替换为ID）
      const orgUnit = values.reportOrgId || '';
      const payload = {
        trackedEntities: [
          {
            orgUnit,
            trackedEntityType: 'TetPerson01',
            attributes: [
              { attribute: ATR_FULL_NAME, value: values.patientName },
              ...(values.idCardNo ? [{ attribute: ATR_NATIONAL_ID, value: values.idCardNo }] : []),
            ],
            enrollments: [
              {
                program: PROGRAM_UNKNOWN_ID,
                orgUnit,
                status: 'ACTIVE',
                enrolledAt: dayjs(reportDate).toISOString(),
                occurredAt: dayjs(symptomOnset).toISOString(),
                attributes: [
                  { attribute: ATR_UNK_NO, value: `UNK-${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` },
                  { attribute: ATR_RPT_DATE, value: reportDate },
                  { attribute: ATR_RPT_ORG, value: orgUnit },
                  ...(values.clinicalSymptoms ? [{ attribute: ATR_UNK_SYMPT, value: values.clinicalSymptoms }] : []),
                  ...(values.suspectedPathogen ? [{ attribute: ATR_UNK_PATHOGEN, value: values.suspectedPathogen }] : []),
                ],
                events: [
                  {
                    program: PROGRAM_UNKNOWN_ID,
                    programStage: STAGE_REGISTER_ID,
                    orgUnit,
                    status: 'ACTIVE',
                    occurredAt: dayjs(reportDate).toISOString(),
                    dataValues: [
                      { dataElement: 'DeUnkStat01', value: 'PENDING_TEST' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      setLastRequest(payload);
      const res = await dhis2Client.post<any>('/api/tracker', payload, { importStrategy: 'CREATE', atomicMode: 'OBJECT', async: 'false' });
      setLastResponse(res);
      const teiUid = res?.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports?.[0]?.uid || null;
      setCreatedTeiUid(teiUid);
      const errors = parseImportErrors(res);
      if (res.status !== 'OK' || errors.length > 0) {
        if (trackerDebug) {
          setDebugOpen(true);
          message.error('提交过程中出现错误，请查看调试信息');
        } else {
          const errorMsg = errors.length > 0 ? errors.join('\n') : '提交失败，请检查数据';
          Modal.error({ title: '提交失败', content: errorMsg, width: 600 });
        }
        return;
      }
      if (trackerDebug) {
        setDebugOpen(true);
        message.success('创建成功，可查看调试信息或跳转到详情页');
      } else {
        message.success('不明原因病例创建成功，正在跳转...');
        setTimeout(() => {
          if (teiUid) navigate(`/unknown-cases/${teiUid}`);
          else navigate('/unknown-cases');
        }, 500);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo?.message || '请检查表单填写项。');
    } finally {
      setSubmitting(false);
    }
  };
  const handleCancel = () => {
    navigate('/unknown-cases');
  };
  const handleJumpToDetail = () => {
    if (createdTeiUid) {
      navigate(`/unknown-cases/${createdTeiUid}`);
    } else {
      message.info('未解析到 TEI UID，请先检查错误信息');
    }
  };
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4} style={{ margin: 0 }}>新增不明原因病例</Title>
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
        title="同步导入结果（不明原因病例-调试）"
      />
      {debugOpen && (
        <Card>
          <Space>
            <Button onClick={() => setDebugOpen(false)}>关闭调试窗口</Button>
            <Button type="primary" onClick={handleJumpToDetail}>跳转到病例详情</Button>
          </Space>
        </Card>
      )}
    </Space>
  );
};
export default NewUnknownCase;