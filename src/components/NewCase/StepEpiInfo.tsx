import { Card, Col, DatePicker, Form, Input, Radio, Row, Typography } from 'antd';

const { Title } = Typography;

export interface StepEpiValues {
  hasExposure?: boolean;
  exposure?: string;
  hasContact?: boolean;
  contactDate?: any;
  contactLocation?: string;
  contact?: string;
  hasTravel?: boolean;
  travelStartDate?: any;
  travelEndDate?: any;
  travelDestination?: string;
  travel?: string;
}

export default function StepEpiInfo({ form }: { form: any }) {
  const hasContact = Form.useWatch('hasContact', form);
  const hasTravel = Form.useWatch('hasTravel', form);
  const hasExposure = Form.useWatch('hasExposure', form);

  return (
    <Card>
      <Title level={4}>第二步: 流行病学信息</Title>
      <Form form={form} layout="vertical">
        <Card title="暴露史" style={{ marginBottom: 24 }}>
          <Form.Item label="是否有疫区暴露史?" name="hasExposure" initialValue={false}>
            <Radio.Group>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="暴露详情" name="exposure">
            <Input.TextArea rows={3} placeholder="请详细描述暴露史" disabled={!hasExposure} />
          </Form.Item>
        </Card>

        <Card title="接触史" style={{ marginBottom: 24 }}>
          <Form.Item label="是否有确诊/疑似病例接触史?" name="hasContact" initialValue={false}>
            <Radio.Group>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="接触时间" name="contactDate">
                <DatePicker style={{ width: '100%' }} disabled={!hasContact} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="接触地点" name="contactLocation">
                <Input placeholder="请输入接触地点" disabled={!hasContact} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="接触详情" name="contact">
            <Input.TextArea rows={3} placeholder="请详细描述接触史" disabled={!hasContact} />
          </Form.Item>
        </Card>

        <Card title="旅行史">
          <Form.Item label="近14天是否有外出旅行?" name="hasTravel" initialValue={false}>
            <Radio.Group>
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="出发时间" name="travelStartDate">
                <DatePicker style={{ width: '100%' }} disabled={!hasTravel} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="返回时间" name="travelEndDate">
                <DatePicker style={{ width: '100%' }} disabled={!hasTravel} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="目的地" name="travelDestination">
            <Input placeholder="请输入目的地" disabled={!hasTravel} />
          </Form.Item>
          <Form.Item label="旅行详情" name="travel">
            <Input.TextArea rows={3} placeholder="请详细描述旅行史" disabled={!hasTravel} />
          </Form.Item>
        </Card>
      </Form>
    </Card>
  );
}