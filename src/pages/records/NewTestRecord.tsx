import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCaseDetails } from '../../services/caseDetailsService';
import { createTestEvent } from '../../services/eventService';

const { Title } = Typography;
const { TextArea } = Input;

const NewTestRecord = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      message.error('缺少个案ID');
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
        form.setFieldsValue({
          sampleCollectionDate: dayjs(),
          testStatus: '待确认',
        });
      } catch (e: any) {
        message.error(`加载个案信息失败: ${e.message}`);
        navigate(`/cases/${caseId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, navigate, form]);

  const handleSubmit = async () => {
    if (!enrollment || !orgUnit) {
      message.error('缺少必要的上下文信息');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const occurredAt = dayjs().format('YYYY-MM-DD');
      const sampleCollectionDate = values.sampleCollectionDate.format('YYYY-MM-DD');
      const testDate = values.testDate ? values.testDate.format('YYYY-MM-DD') : undefined;

      const result = await createTestEvent(enrollment, orgUnit, occurredAt, {
        testNo: `TEST-${Date.now().toString().slice(-6)}`,
        sampleCollectionDate,
        sampleType: values.sampleType,
        testType: values.testType,
        lab: values.testOrgName,
        testDate,
        result: values.testResult,
        resultDetails: values.resultDetails,
        pathogen: values.pathogenDetected,
        testStatus: values.testStatus,
      });

      if (result.status === 'OK') {
        message.success('检测记录创建成功!');
        navigate(`/cases/${caseId}`);
      } else {
        message.error('创建失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate(`/cases/${caseId}`);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>新增检测记录</Title>
        <Form form={form} layout="vertical" initialValues={{ sampleCollectionDate: dayjs(), testStatus: '待确认' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="样本采集时间" name="sampleCollectionDate" rules={[{ required: true, message: '请选择样本采集时间' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="样本类型" name="sampleType" rules={[{ required: true, message: '请选择样本类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="咽拭子">咽拭子</Select.Option>
                  <Select.Option value="血液">血液</Select.Option>
                  <Select.Option value="粪便">粪便</Select.Option>
                  <Select.Option value="尿液">尿液</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="检测类型" name="testType" rules={[{ required: true, message: '请选择检测类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="核酸检测">核酸检测</Select.Option>
                  <Select.Option value="抗体检测">抗体检测</Select.Option>
                  <Select.Option value="培养">培养</Select.Option>
                  <Select.Option value="影像学">影像学</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="检测机构" name="testOrgName" rules={[{ required: true, message: '请输入检测机构', min: 2, max: 200 }]}>
                <Input placeholder="请输入检测机构" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="检测日期"
                name="testDate"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const sampleCollectionDate = getFieldValue('sampleCollectionDate');
                      if (!value || !sampleCollectionDate || dayjs(value).isSameOrAfter(dayjs(sampleCollectionDate), 'day')) return Promise.resolve();
                      return Promise.reject(new Error('检测日期不能早于样本采集时间!'));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="检测结果" name="testResult">
                <Radio.Group>
                  <Radio value="阳性">阳性</Radio>
                  <Radio value="阴性">阴性</Radio>
                  <Radio value="待定">待定</Radio>
                  <Radio value="不确定">不确定</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="检出病原体" name="pathogenDetected" rules={[{ max: 200, message: '病原体名称不能超过200字' }]}>
                <Input placeholder="请输入检出的病原体" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="结果详情" name="resultDetails" rules={[{ max: 1000, message: '结果详情不能超过1000字' }]}>
                <TextArea rows={2} placeholder="请输入结果详情" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="检测状态" name="testStatus" rules={[{ required: true, message: '请选择检测状态' }]}>
                <Radio.Group>
                  <Radio value="待确认">待确认</Radio>
                  <Radio value="已确认">已确认</Radio>
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

export default NewTestRecord;