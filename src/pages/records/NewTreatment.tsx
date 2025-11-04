import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCaseDetails } from '../../services/caseDetailsService';
import { createTreatmentEvent } from '../../services/eventService';

const { Title } = Typography;
const { TextArea } = Input;

const NewTreatment = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

  const treatmentType = Form.useWatch('treatmentType', form);

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
          treatmentDate: dayjs(),
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

      const occurredAt = values.treatmentDate.format('YYYY-MM-DD');
      const dischargeDate = values.dischargeDate ? values.dischargeDate.format('YYYY-MM-DD') : undefined;

      const result = await createTreatmentEvent(
        enrollment,
        orgUnit,
        occurredAt,
        {
          type: values.treatmentType,
          hospital: values.hospitalName,
          department: values.departmentName,
          doctor: values.doctorName,
          diagnosis: values.diagnosis,
          plan: values.treatmentPlan,
          medications: values.medications,
          outcome: values.treatmentOutcome,
          dischargeDate,
        }
      );

      if (result.status === 'OK') {
        message.success('治疗记录创建成功!');
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
        <Title level={4}>新增治疗记录</Title>
        <Form form={form} layout="vertical" initialValues={{ treatmentDate: dayjs() }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="治疗日期" name="treatmentDate" rules={[{ required: true, message: '请选择治疗日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="治疗类型" name="treatmentType" rules={[{ required: true, message: '请选择治疗类型' }]}>
                <Radio.Group>
                  <Radio value="门诊">门诊</Radio>
                  <Radio value="住院">住院</Radio>
                  <Radio value="居家隔离">居家隔离</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="医院名称" name="hospitalName" rules={[{ required: true, message: '请输入医院名称', min: 2, max: 200 }]}>
                <Input placeholder="请输入医院名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="科室名称" name="departmentName" rules={[{ min: 2, max: 100, message: '科室名称2-100字' }]}>
                <Input placeholder="请输入科室名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="医生姓名" name="doctorName" rules={[{ min: 2, max: 50, message: '医生姓名2-50字' }]}>
                <Input placeholder="请输入医生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="治疗转归" name="treatmentOutcome">
                <Select placeholder="请选择">
                  <Select.Option value="治愈">治愈</Select.Option>
                  <Select.Option value="好转">好转</Select.Option>
                  <Select.Option value="无效">无效</Select.Option>
                  <Select.Option value="死亡">死亡</Select.Option>
                  <Select.Option value="转院">转院</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="诊断" name="diagnosis" rules={[{ required: true, message: '请输入诊断', min: 10, max: 500 }]}>
                <TextArea rows={2} placeholder="请输入诊断" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="治疗方案" name="treatmentPlan" rules={[{ required: true, message: '请输入治疗方案', min: 10, max: 1000 }]}>
                <TextArea rows={3} placeholder="请输入治疗方案" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="用药情况" name="medications" rules={[{ max: 1000, message: '用药情况不能超过1000字' }]}>
                <TextArea rows={3} placeholder="请输入用药情况" />
              </Form.Item>
            </Col>
            {treatmentType === '住院' && (
              <Col span={12}>
                <Form.Item
                  label="出院日期"
                  name="dischargeDate"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const treatmentDate = getFieldValue('treatmentDate');
                        if (!value || !treatmentDate || dayjs(value).isSameOrAfter(dayjs(treatmentDate), 'day')) return Promise.resolve();
                        return Promise.reject(new Error('出院日期不能早于治疗日期!'));
                      },
                    }),
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            )}
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

export default NewTreatment;