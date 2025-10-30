import { useMemo } from 'react';
import { Steps, Button, Card, Space, Row, Col, Typography, Alert } from 'antd';
import dayjs from 'dayjs';
import appConfig from '../../config.json';
import StepBasicInfo from '../../components/newcase/StepBasicInfo';
import StepEpiInfo from '../../components/newcase/StepEpiInfo';
import StepDiagnosis from '../../components/newcase/StepDiagnosis';
import StepConfirm from '../../components/newcase/StepConfirm';
import SubmitDebugger from '../../components/newcase/SubmitDebugger';
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
    return {
      ...b,
      diseaseName: ctx.diseaseOpts.find(o => o.value === b.diseaseCode)?.label,
      reportDate: b.reportDate ? dayjs(b.reportDate).format('YYYY-MM-DD') : undefined,
      symptomOnsetDate: b.symptomOnsetDate ? dayjs(b.symptomOnsetDate).format('YYYY-MM-DD') : undefined,
      diagnosisDate: d.diagnosisDate ? dayjs(d.diagnosisDate).format('YYYY-MM-DD') : undefined,
      exposure: e?.hasExposure ? e.exposure : undefined,
      contact: e?.hasContact ? e.contact : undefined,
      travel: e?.hasTravel ? e.travel : undefined,
      caseSourceName: ctx.caseSrcOpts.find(o => o.value === d.caseSourceCode)?.label,
      caseStatusName: ctx.caseStatOpts.find(o => o.value === d.caseStatusCode)?.label,
    };
  }, [ctx.formBasic, ctx.formEpi, ctx.formDiag, ctx.diseaseOpts, ctx.caseSrcOpts, ctx.caseStatOpts]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>新增个案调查表</Title>
        </Col>
        <Col>
          <Space>
            <Button onClick={ctx.saveDraft} loading={ctx.loading}>保存草稿</Button>
            <Button type="primary" onClick={ctx.handleSubmit} loading={ctx.loading}>提交</Button>
            <Button danger onClick={ctx.handleCancel}>取消</Button>
          </Space>
        </Col>
      </Row>

      {trackerDebug && (
        <Alert
          type="info"
          showIcon
          message="调试模式开启"
          description="提交后将展示同步导入返回的 bundleReport。若出现 E1064（身份证重复），系统会自动切换为沿用已有人员并仅创建入组与调查事件。若出现 E1018（个案编号必填），将自动生成随机个案编号后重试。可在 config.json -> tracker.debug 关闭调试模式。"
        />
      )}

      <Card>
        <Steps current={ctx.current} items={[
          { title: '基本信息' },
          { title: '流行病学' },
          { title: '诊断信息' },
          { title: '确认提交' },
        ]} />
        <div style={{ marginTop: 24, minHeight: 400 }}>
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
            <StepDiagnosis form={ctx.formDiag} caseSourceOptions={ctx.caseSrcOpts} caseStatusOptions={ctx.caseStatOpts} />
          )}
          {ctx.current === 3 && <StepConfirm data={previewData} />}
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            {ctx.current > 0 && <Button onClick={ctx.prev}>上一步</Button>}
            {ctx.current < 3 && <Button type="primary" onClick={ctx.next}>下一步</Button>}
            {ctx.current === 3 && <Button type="primary" onClick={ctx.handleSubmit} loading={ctx.loading}>提交</Button>}
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
      <div style={{ textAlign: 'right' }}>
        {ctx.debugOpen && (
          <Space>
            <Button onClick={() => ctx.setDebugOpen(false)}>关闭</Button>
            <Button type="primary" onClick={ctx.handleJumpToDetail}>继续跳转到详情</Button>
          </Space>
        )}
      </div>
    </Space>
  );
}