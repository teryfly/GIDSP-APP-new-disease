import { Card, DatePicker, Form, Input, Select, Typography } from 'antd';

const { Title } = Typography;

export interface StepDiagnosisValues {
  initialDiagnosis?: string;
  finalDiagnosis?: string;
  diagnosisDate?: any;
  caseSourceCode?: string; // OsCaseSrc01 code
  caseStatusCode?: string; // OsCaseStat1 code
}

interface Props {
  form: any;
  caseSourceOptions: { value: string; label: string }[];
  caseStatusOptions: { value: string; label: string }[];
}

export default function StepDiagnosis({ form, caseSourceOptions, caseStatusOptions }: Props) {
  return (
    <Card>
      <Title level={4}>第三步: 诊断信息</Title>
      <Form layout="vertical" form={form}>
        <Form.Item label="初步诊断" name="initialDiagnosis" rules={[{ required: true, message: '请输入初步诊断' }]}>
          <Input placeholder="请输入初步诊断" />
        </Form.Item>
        <Form.Item label="确诊诊断" name="finalDiagnosis">
          <Input placeholder="请输入确诊诊断" />
        </Form.Item>
        <Form.Item label="诊断日期" name="diagnosisDate" rules={[{ required: true, message: '请选择诊断日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="个案来源" name="caseSourceCode" rules={[{ required: true, message: '请选择个案来源' }]}>
          <Select placeholder="请选择来源" options={caseSourceOptions} />
        </Form.Item>
        <Form.Item label="个案状态" name="caseStatusCode">
          <Select placeholder="可选（提交时写入调查事件）" options={caseStatusOptions} allowClear />
        </Form.Item>
      </Form>
    </Card>
  );
}