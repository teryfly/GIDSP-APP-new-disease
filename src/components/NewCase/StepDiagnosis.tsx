import { Card, DatePicker, Form, Input, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { validateNotFuture } from '../../utils/dateValidators';

const { Title } = Typography;

export interface StepDiagnosisValues {
  initialDiagnosis?: string;
  finalDiagnosis?: string;
  diagnosisDate?: any;
  caseSourceCode?: string;
  caseStatusCode?: string;
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
        <Form.Item 
          label="初步诊断" 
          name="initialDiagnosis" 
          rules={[
            { required: true, message: '请输入初步诊断' },
            { min: 2, max: 500, message: '初步诊断2-500个字符' }
          ]}
        >
          <Input.TextArea 
            rows={2} 
            placeholder="请输入初步诊断信息" 
            showCount
            maxLength={500}
          />
        </Form.Item>
        <Form.Item 
          label="确诊诊断" 
          name="finalDiagnosis"
          rules={[
            { min: 2, max: 500, message: '确诊诊断2-500个字符' }
          ]}
        >
          <Input.TextArea 
            rows={2} 
            placeholder="请输入确诊诊断信息（可选）" 
            showCount
            maxLength={500}
          />
        </Form.Item>
        <Form.Item 
          label="诊断日期" 
          name="diagnosisDate" 
          rules={[
            { required: true, message: '请选择诊断日期' },
            { validator: validateNotFuture }
          ]}
          tooltip="诊断日期通常在症状开始日期之后，不能晚于今天"
        >
          <DatePicker 
            style={{ width: '100%' }} 
            format="YYYY-MM-DD"
            disabledDate={(current) => current && current > dayjs().endOf('day')}
            placeholder="选择诊断日期"
          />
        </Form.Item>
        <Form.Item 
          label="个案来源" 
          name="caseSourceCode" 
          rules={[{ required: true, message: '请选择个案来源' }]}
        >
          <Select placeholder="请选择来源" options={caseSourceOptions} />
        </Form.Item>
        <Form.Item 
          label="个案状态" 
          name="caseStatusCode"
          tooltip="可选，提交时将写入调查事件的个案状态字段"
        >
          <Select placeholder="请选择个案状态（可选）" options={caseStatusOptions} allowClear />
        </Form.Item>
      </Form>
    </Card>
  );
}