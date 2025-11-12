import { useMemo } from 'react';
import { Steps, Button, Card, Space, Row, Col, Typography, Alert } from 'antd';
import { LeftOutlined, RightOutlined, SaveOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import appConfig from '../../config.json';
import StepBasicInfo from '../../components/NewCase/StepBasicInfo';
import StepEpiInfo from '../../components/NewCase/StepEpiInfo';
import StepDiagnosis from '../../components/NewCase/StepDiagnosis';
import StepConfirm from '../../components/NewCase/StepConfirm';
import SubmitDebugger from '../../components/NewCase/SubmitDebugger';
import { useNewCase } from './useNewCase';

const { Step } = Steps;
const { Title } = Typography;

export default function NewCase() {
  const ctx = useNewCase();
  const trackerDebug = Boolean((appConfig as any)?.tracker?.debug);

  const previewData = useMemo(() => {
    const b = ctx.formBasic.getFieldsValue(true);
    const e = ctx.formEpi.getFieldsValue(true);
    const d = ctx.formDiag.getFieldsValue(true);
    
    let exposureText = '无';
    if (e?.hasExposure && e?.exposure) {
      exposureText = e.exposure;
    }
    
    let contactText = '无';
    if (e?.hasContact && e?.contact) {
      contactText = e.contact;
    }
    
    let travelText = '无';
    if (e?.hasTravel && e?.travel) {
      travelText = e.travel;
    }
    
    return {
      ...b,
      ...d,
      diseaseName: ctx.diseaseOpts.find(o => o.value === b.diseaseCode)?.label,
      reportDate: b.reportDate ? dayjs(b.reportDate).format('YYYY-MM-DD') : undefined,
      symptomOnsetDate: b.symptomOnsetDate ? dayjs(b.symptomOnsetDate).format('YYYY-MM-DD') : undefined,
      diagnosisDate: d.diagnosisDate ? dayjs(d.diagnosisDate).format('YYYY-MM-DD') : undefined,
      exposure: exposureText,
      contact: contactText,
      travel: travelText,
      caseSourceName: ctx.caseSrcOpts.find(o => o.value === d.caseSourceCode)?.label,
      caseStatusName: ctx.caseStatOpts.find(o => o.value === d.caseStatusCode)?.label,
    };
  }, [ctx.formBasic, ctx.formEpi, ctx.formDiag, ctx.diseaseOpts, ctx.caseSrcOpts, ctx.caseStatOpts, ctx.current]);

  const stepTitles = ['基本信息', '流行病学信息', '诊断信息', '确认提交'];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>新增个案调查表</Title>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<SaveOutlined />} 
              onClick={ctx.saveDraft} 
              loading={ctx.loading}
              disabled={ctx.current === 3}
            >
              保存草稿
            </Button>
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={ctx.handleSubmit} 
              loading={ctx.loading}
              disabled={ctx.current !== 3}
            >
              提交
            </Button>
            <Button 
              danger 
              icon={<CloseOutlined />}
              onClick={ctx.handleCancel}
              disabled={ctx.loading}
            >
              取消
            </Button>
          </Space>
        </Col>
      </Row>

      {trackerDebug && (
        <Alert
          type="info"
          showIcon
          message="调试模式已开启"
          description="提交后将展示同步导入返回的 bundleReport。可在 config.json -> tracker.debug 关闭调试模式。"
          closable
        />
      )}

      <Card>
        <Steps 
          current={ctx.current} 
          items={stepTitles.map((title, idx) => ({ 
            title, 
            description: idx < ctx.current ? '已完成' : idx === ctx.current ? '进行中' : '待填写'
          }))} 
        />
        <div style={{ marginTop: 32, minHeight: 450 }}>
          {ctx.current === 0 && (
            <StepBasicInfo
              form={ctx.formBasic}
              diseaseOptions={ctx.diseaseOpts}
              defaultOrg={ctx.defaultOu}
              onValidateId={ctx.handleValidateNationalId}
            />
          )}
          {ctx.current === 1 && <StepEpiInfo form={ctx.formEpi} />}
          {ctx.current === 2 && (
            <StepDiagnosis 
              form={ctx.formDiag} 
              caseSourceOptions={ctx.caseSrcOpts} 
              caseStatusOptions={ctx.caseStatOpts} 
            />
          )}
          {ctx.current === 3 && <StepConfirm data={previewData} />}
        </div>
        <div style={{ marginTop: 32, textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
          <Space size="large">
            {ctx.current > 0 && (
              <Button 
                size="large"
                icon={<LeftOutlined />}
                onClick={ctx.prev}
                disabled={ctx.loading}
              >
                上一步
              </Button>
            )}
            {ctx.current < 3 && (
              <Button 
                type="primary" 
                size="large"
                icon={<RightOutlined />}
                onClick={ctx.next}
                disabled={ctx.loading}
              >
                下一步：{stepTitles[ctx.current + 1]}
              </Button>
            )}
            {ctx.current === 3 && (
              <Button 
                type="primary" 
                size="large"
                icon={<CheckOutlined />}
                onClick={ctx.handleSubmit} 
                loading={ctx.loading}
              >
                确认提交
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <SubmitDebugger
        open={ctx.debugOpen}
        onClose={() => ctx.setDebugOpen(false)}
        lastRequest={ctx.lastRequest}
        lastResponse={ctx.lastResponse}
        title="同步导入结果（调试）"
      />
      {ctx.debugOpen && (
        <Card>
          <Space>
            <Button onClick={() => ctx.setDebugOpen(false)}>关闭调试窗口</Button>
            <Button type="primary" onClick={ctx.handleJumpToDetail}>跳转到个案详情</Button>
          </Space>
        </Card>
      )}
    </Space>
  );
}