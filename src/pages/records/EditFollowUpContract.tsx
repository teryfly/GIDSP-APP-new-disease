import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Tooltip, Checkbox, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails, updateEvents } from '../../services/caseDetailsService';
import { getAllOrgUnits } from '../../services/caseService';
import { toFollowUpForm, buildFollowUpUpdateDVs } from '../../services/mappers/eventFormMappers';
import { PS } from '../../services/contractMapping';
import { validateNotFuture } from '../../utils/dateValidators';
import type { OrgUnit } from '../../services/caseService';

const { Title } = Typography;

const EditFollowUpContract = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId, id } = useParams<{ caseId: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ value: string; label: string }[]>([]);

  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);
  const [statusCompleted, setStatusCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!caseId || !id) {
      message.error('缺少必要参数');
      navigate('/cases');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        // 并行加载事件数据、个案详情和机构数据
        const [event, tei, orgUnits] = await Promise.all([
          getEvent(id),
          getCaseDetails(caseId),
          getAllOrgUnits()
        ]);
        
        const enr = tei.enrollments?.[0];
        if (!enr) throw new Error('该个案没有入组记录');
        setEnrollment(enr.enrollment);
        setOrgUnit(event.orgUnit);
        setStatusCompleted(event.status === 'COMPLETED');
        
        // 设置机构选项
        setOrgUnitOptions(orgUnits.map((o: OrgUnit) => ({ value: o.id, label: o.name })));

        const initial = toFollowUpForm(event.dataValues || []);
        form.setFieldsValue({
          occurredAt: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          orgUnit: event.orgUnit,
          ...initial,
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

      const occurred = values.occurredAt?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');

      const dvs = buildFollowUpUpdateDVs({
        followUpMethod: values.followUpMethod,
        healthStatus: values.healthStatus,
        treatmentCompliance: values.treatmentCompliance,
        temperature: values.temperature !== undefined && values.temperature !== '' && values.temperature !== null ? Number(values.temperature) : null,
        symptoms: values.symptoms,
        nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.format('YYYY-MM-DD') : null,
        remarks: values.remarks,
      });

      const res = await updateEvents([
        {
          event: id,
          program: 'PrgCaseMgt1',
          programStage: PS.FOLLOW_UP,
          enrollment,
          orgUnit: values.orgUnit, // 使用表单中选择的机构
          status: statusCompleted ? 'COMPLETED' : 'ACTIVE',
          occurredAt: occurred,
          dataValues: dvs,
        },
      ] as any);

      if (res.status === 'OK') {
        message.success('随访记录更新成功!');
        navigate(`/cases/${caseId}`);
      } else {
        message.error('更新失败，请检查数据');
        console.error('Import result:', res);
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
        <Title level={4}>编辑随访记录</Title>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Report date"
                name="occurredAt"
                rules={[{ required: true, message: '请选择Report date' }, { validator: validateNotFuture }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Scheduled date <Tooltip title="无法更改 已完成 事件的预定日期"><InfoCircleOutlined /></Tooltip>
                  </span>
                }
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabled placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item 
                label="机构" 
                name="orgUnit"
                rules={[{ required: true, message: '请选择机构' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择机构"
                  options={orgUnitOptions}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="治疗依从性" name="treatmentCompliance" rules={[{ required: true, message: '请选择治疗依从性' }]}>
                <Radio.Group>
                  <Radio value="GOOD">良好</Radio>
                  <Radio value="FAIR">一般</Radio>
                  <Radio value="POOR">差</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="健康状态" name="healthStatus" rules={[{ required: true, message: '请选择健康状态' }]}>
                <Radio.Group>
                  <Radio value="NORMAL">正常</Radio>
                  <Radio value="ABNORMAL">异常</Radio>
                  <Radio value="HOSPITALIZED">住院</Radio>
                  <Radio value="DEATH">死亡</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="随访方式" name="followUpMethod" rules={[{ required: true, message: '请选择随访方式' }]}>
                <Radio.Group>
                  <Radio value="PHONE">电话随访</Radio>
                  <Radio value="ON_SITE">现场随访</Radio>
                  <Radio value="ONLINE">线上随访</Radio>
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

            <Col span={24}>
              <Form.Item label="症状描述" name="symptoms" rules={[{ max: 1000, message: '症状描述不能超过1000字' }]}>
                <Input.TextArea rows={3} placeholder="请输入症状描述" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="下次随访日期"
                name="nextFollowUpDate"
                rules={[{ validator: validateNotFuture }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="备注" name="remarks" rules={[{ max: 1000, message: '备注不能超过1000字' }]}>
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Checkbox checked={statusCompleted} onChange={(e) => setStatusCompleted(e.target.checked)}>
                事件完成
              </Checkbox>
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

export default EditFollowUpContract;