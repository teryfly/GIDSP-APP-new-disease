import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails } from '../../services/caseDetailsService';
import { updateTreatmentEvent } from '../../services/eventService';

const { Title } = Typography;
const { TextArea } = Input;

const EditTreatment = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId, id } = useParams<{ caseId: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

  const treatmentType = Form.useWatch('treatmentType', form);

  useEffect(() => {
    if (!caseId || !id) {
      message.error('缺少必要参数');
      navigate('/cases');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [event, tei] = await Promise.all([getEvent(id), getCaseDetails(caseId)]);
        const enr = tei.enrollments?.[0];
        if (!enr) {
          message.error('该个案没有入组记录');
          navigate(`/cases/${caseId}`);
          return;
        }
        setEnrollment(enr.enrollment);
        setOrgUnit(event.orgUnit);

        const dvMap = new Map<string, string>((event.dataValues || []).map((dv: any) => [dv.dataElement, String(dv.value)]));

        form.setFieldsValue({
          treatmentDate: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          treatmentType: dvMap.get('DeTrtType001'),
          hospitalName: dvMap.get('DeHospital1'),
          departmentName: dvMap.get('DeDept00001'),
          doctorName: dvMap.get('DeDoctor001'),
          diagnosis: dvMap.get('DeDiag00001'),
          treatmentPlan: dvMap.get('DePlan00001'),
          medications: dvMap.get('DeMeds00001'),
          treatmentOutcome: dvMap.get('DeOutcome01'),
          dischargeDate: dvMap.get('DeDischrgDt') ? dayjs(dvMap.get('DeDischrgDt')) : undefined,
        });
      } catch (e: any) {
        message.error(`加载失败: ${e.message}`);
        navigate(`/cases/${caseId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, id, navigate, form]);

  const handleSubmit = async () => {
    if (!enrollment || !orgUnit || !id) {
      message.error('缺少必要的上下文信息');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const occurredAt = values.treatmentDate.format('YYYY-MM-DD');
      const dischargeDate = values.dischargeDate ? values.dischargeDate.format('YYYY-MM-DD') : undefined;
      const result = await updateTreatmentEvent(
        id,
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
        message.success('治疗记录更新成功!');
        navigate(`/cases/${caseId}`);
      } else {
        message.error('更新失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/cases/${caseId}`);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑治疗记录</Title>
        <Form form={form} layout="vertical">
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
              <Form.Item label="医院名称" name="hospitalName" rules={[{ required: true, message: '请输入医院名称' }]}>
                <Input placeholder="请输入医院名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="科室名称" name="departmentName">
                <Input placeholder="请输入科室名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="医生姓名" name="doctorName">
                <Input placeholder="请输入医生姓名" />
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
            {treatmentType === '住院' && (
              <Col span={12}>
                <Form.Item label="出院日期" name="dischargeDate">
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

export default EditTreatment;