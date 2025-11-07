import { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Row, Col, Card, Typography, Checkbox, Input, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { getDHIS2MetadataInfo } from '../../utils/dhis2MetadataUtils';

const { Title } = Typography;

export interface StepTwoFormData {
  occurredAt: dayjs.Dayjs; // Report date
  scheduledAt: dayjs.Dayjs; // Scheduled date (今天，不可更改)
  pushedToCase: boolean;
  pushedToEpi: boolean;
  pushedCaseId?: string;
  pushedToEmergency: boolean;
  emergencyDate?: dayjs.Dayjs;
  emergencyTime?: string;
  pushCaseDate?: dayjs.Dayjs;
  pushCaseTime?: string;
  pushEpiDate?: dayjs.Dayjs;
  pushEpiTime?: string;
  status: string; // 不明病例状态 code
  completeEvent: boolean;
}

interface Props {
  form: FormInstance<StepTwoFormData>;
  orgUnit: string;
}

const UnknownCaseStepTwoForm = ({ form, orgUnit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 加载状态选项
      const optionSet = await getDHIS2MetadataInfo('', '', '', 'OsUnkStat01');
      const options = optionSet?.options?.map((option: any) => ({
        value: option.code,
        label: option.name
      })) || [];
      
      setStatusOptions(options);

      // 设置默认值 - 使用 dayjs 对象
      form.setFieldsValue({
        scheduledAt: dayjs(),
        pushedToCase: false,
        pushedToEpi: false,
        pushedToEmergency: false,
        completeEvent: false,
      });
    } catch (e: any) {
      message.error(`加载初始数据失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Card>
      <Title level={4}>第二步：不明病例登记</Title>
      <Form form={form} layout="vertical">
        <Title level={5}>基本信息部分</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Report date"
              name="occurredAt"
              rules={[{ required: true, message: '请选择Report date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Scheduled date" name="scheduledAt">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Organisation unit">
              <Input value={orgUnit} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="已推送个案管理" name="pushedToCase" valuePropName="checked">
              <Select options={[{ value: true, label: 'YES' }, { value: false, label: 'NO' }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="已推送流调系统-3" name="pushedToEpi" valuePropName="checked">
              <Select options={[{ value: true, label: 'YES' }, { value: false, label: 'NO' }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="推送个案ID" name="pushedCaseId">
              <Input placeholder="推送个案ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="已上报应急系统" name="pushedToEmergency" valuePropName="checked">
              <Select options={[{ value: true, label: 'YES' }, { value: false, label: 'NO' }]} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="上报应急时间 (Date)" name="emergencyDate">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Time" name="emergencyTime">
              <Input placeholder="8:00" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="推送个案时间 (Date)" name="pushCaseDate">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Time" name="pushCaseTime">
              <Input placeholder="8:00" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="推送流调时间-3 (Date)" name="pushEpiDate">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Time" name="pushEpiTime">
              <Input placeholder="8:00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="不明病例状态"
              name="status"
              rules={[{ required: true, message: '请选择不明病例状态' }]}
            >
              <Select placeholder="请选择状态" options={statusOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: 24 }}>状态部分</Title>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="completeEvent" valuePropName="checked">
              <Checkbox>Complete event</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default UnknownCaseStepTwoForm;