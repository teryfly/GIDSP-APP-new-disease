import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select, Tooltip, Checkbox, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails, updateEvents } from '../../services/caseDetailsService';
import { toTestForm, buildTestUpdateDVs } from '../../services/mappers/eventFormMappers';
import { PS } from '../../services/contractMapping';
import { validateNotFuture } from '../../utils/dateValidators';

const { Title } = Typography;
const { TextArea } = Input;

const EditTestRecord = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId, id } = useParams<{ caseId: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        const [event, tei] = await Promise.all([getEvent(id), getCaseDetails(caseId)]);
        const enr = tei.enrollments?.[0];
        if (!enr) throw new Error('该个案没有入组记录');
        setEnrollment(enr.enrollment);
        setOrgUnit(event.orgUnit);
        setStatusCompleted(event.status === 'COMPLETED');

        const mapped = toTestForm(event.dataValues || []);
        form.setFieldsValue({
          occurredAt: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          orgUnit: event.orgUnit,
          ...mapped,
          pushLab: String(mapped.pushLab || '') === 'true',
          pushLabDateTime: mapped.pushLabDateTime ? dayjs(mapped.pushLabDateTime) : undefined,
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

      const dvs = buildTestUpdateDVs({
        testNo: values.testNo,
        sampleCollectionDate: values.sampleCollectionDate ? values.sampleCollectionDate.format('YYYY-MM-DD') : undefined,
        sampleType: values.sampleType,
        testType: values.testType,
        testOrgName: values.testOrgName,
        testDate: values.testDate ? values.testDate.format('YYYY-MM-DD') : undefined,
        testResult: values.testResult,
        pathogenDetected: values.pathogenDetected,
        resultDetails: values.resultDetails,
        testStatus: values.testStatus,
        pushLab: values.pushLab,
        pushLabDateTime: values.pushLabDateTime ? values.pushLabDateTime.toISOString() : undefined,
        labReportUrl: values.labReportUrl,
      });

      const res = await updateEvents([
        {
          event: id,
          program: 'PrgCaseMgt1',
          programStage: PS.TEST,
          enrollment,
          orgUnit,
          status: statusCompleted ? 'COMPLETED' : 'ACTIVE',
          occurredAt: occurred,
          dataValues: dvs,
        },
      ] as any);

      if (res.status === 'OK') {
        message.success('检测记录更新成功!');
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
        <Title level={4}>编辑检测记录</Title>
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
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabled placeholder="不可编辑" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="机构" name="orgUnit">
                <Input readOnly />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="样本类型" name="sampleType" rules={[{ required: true, message: '请选择样本类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="THROAT_SWAB">咽拭子</Select.Option>
                  <Select.Option value="BLOOD">血液</Select.Option>
                  <Select.Option value="STOOL">粪便</Select.Option>
                  <Select.Option value="URINE">尿液</Select.Option>
                  <Select.Option value="OTHER">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="推送实验室时间" name="pushLabDateTime">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="已推送实验室" name="pushLab" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测类型" name="testType" rules={[{ required: true, message: '请选择检测类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="NAT">核酸检测</Select.Option>
                  <Select.Option value="ANTIBODY">抗体检测</Select.Option>
                  <Select.Option value="CULTURE">培养</Select.Option>
                  <Select.Option value="IMAGING">影像学</Select.Option>
                  <Select.Option value="OTHER">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测状态" name="testStatus" rules={[{ required: true, message: '请选择检测状态' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="PENDING_CONFIRMATION">待确认</Select.Option>
                  <Select.Option value="CONFIRMED">已确认</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测编号" name="testNo" rules={[{ required: true, message: '请输入检测编号' }]}>
                <Input placeholder="请输入检测编号" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="结果详情" name="resultDetails" rules={[{ max: 1000, message: '结果详情不能超过1000字' }]}>
                <TextArea rows={2} placeholder="请输入结果详情" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="实验室报告URL"
                name="labReportUrl"
                rules={[{ type: 'url', message: '请提供有效的URL' }]}
              >
                <Input placeholder="请输入实验室报告URL" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测到的病原体" name="pathogenDetected">
                <Select placeholder="请选择">
                  <Select.Option value="V001">埃博拉病毒</Select.Option>
                  <Select.Option value="V002">马尔堡病毒</Select.Option>
                  <Select.Option value="V103">SARS-CoV-2</Select.Option>
                  <Select.Option value="B001">霍乱弧菌</Select.Option>
                  <Select.Option value="U001">未知病原体</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="样本采集日期"
                name="sampleCollectionDate"
                rules={[{ required: true, message: '请选择样本采集日期' }, { validator: validateNotFuture }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测机构" name="testOrgName">
                <Input placeholder="请输入检测机构" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测日期" name="testDate" rules={[{ validator: validateNotFuture }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="检测结果" name="testResult">
                <Select placeholder="请选择">
                  <Select.Option value="POSITIVE">阳性</Select.Option>
                  <Select.Option value="NEGATIVE">阴性</Select.Option>
                  <Select.Option value="PENDING">待定</Select.Option>
                  <Select.Option value="UNCERTAIN">不确定</Select.Option>
                </Select>
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

export default EditTestRecord;