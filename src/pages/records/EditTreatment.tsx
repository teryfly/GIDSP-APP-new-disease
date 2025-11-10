import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select, Tooltip, Checkbox } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails, updateEvents } from '../../services/caseDetailsService';
import { getAllOrgUnits } from '../../services/caseService';
import { toTreatmentForm, buildTreatmentUpdateDVs } from '../../services/mappers/eventFormMappers';
import { PS } from '../../services/contractMapping';
import { validateNotFuture } from '../../utils/dateValidators';
import type { OrgUnit } from '../../services/caseService';

const { Title } = Typography;
const { TextArea } = Input;

const EditTreatment = () => {
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

        const mapped = toTreatmentForm(event.dataValues || []);
        form.setFieldsValue({
          occurredAt: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          orgUnit: event.orgUnit,
          ...mapped,
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
      const dischargeDate = values.dischargeDate ? values.dischargeDate.format('YYYY-MM-DD') : undefined;

      const dvs = buildTreatmentUpdateDVs({
        treatmentType: values.treatmentType,
        hospitalName: values.hospitalName,
        departmentName: values.departmentName,
        doctorName: values.doctorName,
        diagnosis: values.diagnosis,
        treatmentPlan: values.treatmentPlan,
        medications: values.medications,
        treatmentOutcome: values.treatmentOutcome,
        dischargeDate,
      });

      const res = await updateEvents([
        {
          event: id,
          program: 'PrgCaseMgt1',
          programStage: PS.TREATMENT,
          enrollment,
          orgUnit: values.orgUnit, // 使用表单中选择的机构
          status: statusCompleted ? 'COMPLETED' : 'ACTIVE',
          occurredAt: occurred,
          dataValues: dvs,
        },
      ] as any);

      if (res.status === 'OK') {
        message.success('治疗记录更新成功!');
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
        <Title level={4}>编辑治疗记录</Title>
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
                  <Space size={4}>
                    <span>Scheduled date</span>
                    <Tooltip title="无法更改 已完成 事件的预定日期">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
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
              <Form.Item label="医生姓名" name="doctorName" rules={[{ min: 2, max: 50, message: '医生姓名2-50字' }]}>
                <Input placeholder="请输入医生姓名" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="诊断结果" name="diagnosis" rules={[{ required: true, message: '请输入诊断结果' }, { min: 2, max: 500 }]}>
                <TextArea rows={2} placeholder="请输入诊断结果" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="医院名称" name="hospitalName" rules={[{ required: true, message: '请输入医院名称' }, { min: 2, max: 200 }]}>
                <Input placeholder="请输入医院名称" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="治疗转归" name="treatmentOutcome">
                <Select placeholder="请选择">
                  <Select.Option value="CURED">治愈</Select.Option>
                  <Select.Option value="IMPROVED">好转</Select.Option>
                  <Select.Option value="INEFFECTIVE">无效</Select.Option>
                  <Select.Option value="DEATH">死亡</Select.Option>
                  <Select.Option value="TRANSFERRED">转院</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="治疗方案" name="treatmentPlan" rules={[{ required: true, message: '请输入治疗方案' }, { min: 10, max: 1000 }]}>
                <TextArea rows={3} placeholder="请输入治疗方案" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="用药情况" name="medications" rules={[{ max: 1000, message: '用药情况不能超过1000字' }]}>
                <TextArea rows={3} placeholder="请输入用药情况" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="治疗类型" name="treatmentType" rules={[{ required: true, message: '请选择治疗类型' }]}>
                <Radio.Group>
                  <Radio value="OUTPATIENT">门诊</Radio>
                  <Radio value="INPATIENT">住院</Radio>
                  <Radio value="HOME_ISOLATION">居家隔离</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="科室名称" name="departmentName" rules={[{ min: 2, max: 100, message: '科室名称2-100字' }]}>
                <Input placeholder="请输入科室名称" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="出院日期" name="dischargeDate" rules={[{ validator: validateNotFuture }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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

export default EditTreatment;