import { Card, Col, DatePicker, Form, Input, Radio, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { validateNotFuture, validateDateRange } from '../../utils/dateValidators';

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
          <Form.Item 
            label="暴露详情" 
            name="exposure"
            rules={hasExposure ? [
              { required: true, message: '请输入暴露详情' },
              { min: 10, max: 1000, message: '暴露详情10-1000个字符' }
            ] : []}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请详细描述暴露史（地点、时间、暴露源等）" 
              disabled={!hasExposure}
              showCount
              maxLength={1000}
            />
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
              <Form.Item 
                label="接触时间" 
                name="contactDate"
                rules={hasContact ? [
                  { required: true, message: '请选择接触时间' },
                  { validator: validateNotFuture }
                ] : []}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  disabled={!hasContact}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  placeholder="选择接触时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="接触地点" 
                name="contactLocation"
                rules={hasContact ? [
                  { required: true, message: '请输入接触地点' },
                  { min: 2, max: 200, message: '接触地点2-200个字符' }
                ] : []}
              >
                <Input placeholder="请输入接触地点" disabled={!hasContact} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            label="接触详情" 
            name="contact"
            rules={hasContact ? [
              { required: true, message: '请输入接触详情' },
              { min: 10, max: 1000, message: '接触详情10-1000个字符' }
            ] : []}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请详细描述接触史（接触对象、接触方式、接触时长等）" 
              disabled={!hasContact}
              showCount
              maxLength={1000}
            />
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
              <Form.Item 
                label="出发时间" 
                name="travelStartDate"
                rules={hasTravel ? [
                  { required: true, message: '请选择出发时间' },
                  { validator: validateNotFuture }
                ] : []}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  disabled={!hasTravel}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  placeholder="选择出发时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="返回时间" 
                name="travelEndDate"
                rules={hasTravel ? [
                  { required: true, message: '请选择返回时间' },
                  { validator: validateNotFuture },
                  ({ getFieldValue }) => ({
                    validator: validateDateRange(() => getFieldValue('travelStartDate'), '返回时间不能早于出发时间')
                  })
                ] : []}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  disabled={!hasTravel}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  placeholder="选择返回时间"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            label="目的地" 
            name="travelDestination"
            rules={hasTravel ? [
              { required: true, message: '请输入目的地' },
              { min: 2, max: 200, message: '目的地2-200个字符' }
            ] : []}
          >
            <Input placeholder="请输入目的地（省市区）" disabled={!hasTravel} />
          </Form.Item>
          <Form.Item 
            label="旅行详情" 
            name="travel"
            rules={hasTravel ? [
              { required: true, message: '请输入旅行详情' },
              { min: 10, max: 1000, message: '旅行详情10-1000个字符' }
            ] : []}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请详细描述旅行史（交通工具、途经地点、住宿情况等）" 
              disabled={!hasTravel}
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Card>
      </Form>
    </Card>
  );
}