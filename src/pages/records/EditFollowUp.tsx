import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails } from '../../services/caseDetailsService';
import { updateFollowUpEvent } from '../../services/eventService';

const { Title } = Typography;

const EditFollowUp = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId, id } = useParams<{ caseId: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

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
          followUpDate: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          followUpMethod: dvMap.get('DeFlwUpMthd'),
          followUpUserId: dvMap.get('DeDoctor001') || '当前用户',
          healthStatus: dvMap.get('DeHlthStat1'),
          temperature: dvMap.get('DeTemp00001') ? Number(dvMap.get('DeTemp00001')) : undefined,
          symptoms: dvMap.get('DeSymptoms1'),
          treatmentCompliance: dvMap.get('DeTrtCompl1'),
          nextFollowUpDate: dvMap.get('DeNxtFlwDt1') ? dayjs(dvMap.get('DeNxtFlwDt1')) : undefined,
          remarks: dvMap.get('DeNotes0001'),
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
      const occurredAt = values.followUpDate.format('YYYY-MM-DD');
      const nextFollowUpDate = values.nextFollowUpDate ? values.nextFollowUpDate.format('YYYY-MM-DD') : undefined;

      const result = await updateFollowUpEvent(
        id,
        enrollment,
        orgUnit,
        occurredAt,
        {
          followUpMethod: values.followUpMethod,
          doctor: values.followUpUserId,
          healthStatus: values.healthStatus,
          temperature: values.temperature ? String(values.temperature) : undefined,
          symptoms: values.symptoms,
          treatmentCompliance: values.treatmentCompliance,
          nextFollowUpDate,
          notes: values.remarks,
        }
      );

      if (result.status === 'OK') {
        message.success('随访记录更新成功!');
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
        <Title level={4}>编辑随访记录</Title>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="随访日期" name="followUpDate" rules={[{ required: true, message: '请选择随访日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="随访方式" name="followUpMethod" rules={[{ required: true, message: '请选择随访方式' }]}>
                <Radio.Group>
                  <Radio value="电话随访">电话随访</Radio>
                  <Radio value="现场随访">现场随访</Radio>
                  <Radio value="线上随访">线上随访</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="随访人员" name="followUpUserId">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="健康状态" name="healthStatus" rules={[{ required: true, message: '请选择健康状态' }]}>
                <Radio.Group>
                  <Radio value="好转">好转</Radio>
                  <Radio value="稳定">稳定</Radio>
                  <Radio value="异常">异常</Radio>
                  <Radio value="恶化">恶化</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="体温(°C)"
                name="temperature"
                rules={[{ type: 'number', min: 35.0, max: 42.0, transform: (v) => (v === '' || v === undefined ? undefined : Number(v)), message: '体温范围35.0-42.0°C' }]}
              >
                <Input placeholder="体温示例: 36.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="治疗依从性" name="treatmentCompliance" rules={[{ required: true, message: '请选择治疗依从性' }]}>
                <Radio.Group>
                  <Radio value="良好">良好</Radio>
                  <Radio value="一般">一般</Radio>
                  <Radio value="差">差</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="症状描述" name="symptoms" rules={[{ max: 500, message: '症状描述不能超过500字' }]}>
                <Input.TextArea rows={3} placeholder="请输入症状描述" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="下次随访日期"
                name="nextFollowUpDate"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const followUpDate = getFieldValue('followUpDate');
                      if (!value || !followUpDate || dayjs(value).isAfter(dayjs(followUpDate), 'day')) return Promise.resolve();
                      return Promise.reject(new Error('下次随访日期必须晚于随访日期!'));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks" rules={[{ max: 500, message: '备注不能超过500字' }]}>
                <Input.TextArea rows={3} placeholder="请输入备注" />
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

export default EditFollowUp;