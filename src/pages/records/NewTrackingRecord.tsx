import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCaseDetails } from '../../services/caseDetailsService';
import { createTrackingEvent } from '../../services/eventService';
import { getRegionOptions } from '../../services/caseService2';

const { Title } = Typography;
const { TextArea } = Input;

interface RegionOption {
  value: string;
  label: string;
}

const NewTrackingRecord = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);

  const trackingType = Form.useWatch('trackingType', form);

  useEffect(() => {
    if (!caseId) {
      message.error('缺少关联个案ID');
      navigate('/cases');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const tei = await getCaseDetails(caseId);
        const enr = tei.enrollments?.[0];
        if (!enr) {
          message.error('该个案没有入组记录');
          navigate(`/cases/${caseId}`);
          return;
        }
        setEnrollment(enr.enrollment);
        setOrgUnit(enr.orgUnit);
        form.setFieldsValue({ trackingDate: dayjs() });

        setRegionLoading(true);
        const opts = await getRegionOptions();
        setRegionOptions(opts);
      } catch (e: any) {
        message.error(`加载个案信息失败: ${e.message}`);
        navigate(`/cases/${caseId}`);
      } finally {
        setRegionLoading(false);
        setLoading(false);
      }
    })();
  }, [caseId, navigate, form]);

  const handleSubmit = async () => {
    if (!enrollment || !orgUnit) {
      message.error('缺少必要的上下文信息（入组或机构）');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Ensure endDate >= startDate (day precision)
      const { startDate, endDate } = values;
      if (!startDate || !endDate || dayjs(endDate).startOf('day').isBefore(dayjs(startDate).startOf('day'))) {
        message.error('结束日期不能早于开始日期');
        setSubmitting(false);
        return;
      }

      const occurredAt = values.trackingDate.format('YYYY-MM-DD');
      const start = values.startDate.format('YYYY-MM-DD');
      const end = values.endDate.format('YYYY-MM-DD');

      const result = await createTrackingEvent(enrollment, orgUnit, occurredAt, {
        type: values.trackingType,
        location: values.locationDescription,
        description: values.exposureDetails,
        startDate: start,
        endDate: end,
        riskAssessment: values.riskAssessment,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        contactPersons: values.contactPersons,
        regionId: values.regionId,
      });

      if (result.status === 'OK') {
        message.success('追踪记录创建成功!');
        navigate(`/cases/${caseId}`);
      } else {
        message.error('创建失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo?.message || '请检查表单填写项。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate(`/cases/${caseId}`);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>新增追踪记录</Title>
        <Form form={form} layout="vertical" initialValues={{ trackingDate: dayjs() }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="追踪日期" name="trackingDate" rules={[{ required: true, message: '请选择追踪日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="追踪类型" name="trackingType" rules={[{ required: true, message: '请选择追踪类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="旅居史">旅居史</Select.Option>
                  <Select.Option value="接触史">接触史</Select.Option>
                  <Select.Option value="物品暴露史">物品暴露史</Select.Option>
                  <Select.Option value="场所暴露史">场所暴露史</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束日期"
                name="endDate"
                rules={[
                  { required: true, message: '请选择结束日期' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue('startDate');
                      if (!value || !start) return Promise.resolve();
                      const v = dayjs(value).startOf('day');
                      const s = dayjs(start).startOf('day');
                      return v.isBefore(s) ? Promise.reject(new Error('结束日期不能早于开始日期!')) : Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="关联地区" name="regionId" rules={[{ required: true, message: '请选择关联地区' }]}>
                <Select
                  placeholder="请选择地区"
                  loading={regionLoading}
                  options={regionOptions}
                  showSearch
                  filterOption={(input, option) => ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="地点描述" name="locationDescription" rules={[{ required: true, message: '请输入地点描述', min: 10, max: 500 }]}>
                <TextArea rows={2} placeholder="请输入地点描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="经度" name="longitude">
                <Input placeholder="请输入经度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="纬度" name="latitude">
                <Input placeholder="请输入纬度" />
              </Form.Item>
            </Col>
            {trackingType === '接触史' && (
              <Col span={24}>
                <Form.Item label="接触人员信息" name="contactPersons" rules={[{ max: 1000, message: '接触人员信息不能超过1000字' }]}>
                  <TextArea rows={2} placeholder="请输入接触人员信息" />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item label="暴露详情" name="exposureDetails" rules={[{ required: true, message: '请输入暴露详情', min: 10, max: 1000 }]}>
                <TextArea rows={3} placeholder="请输入暴露详情" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="风险评估" name="riskAssessment" rules={[{ required: true, message: '请选择风险评估' }]}>
                <Radio.Group>
                  <Radio value="高风险">高风险</Radio>
                  <Radio value="中风险">中风险</Radio>
                  <Radio value="低风险">低风险</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>保存</Button>
        </Space>
      </div>
    </Space>
  );
};

export default NewTrackingRecord;