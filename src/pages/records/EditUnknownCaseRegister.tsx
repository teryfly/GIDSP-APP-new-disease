import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Input, Row, Col, Select, Checkbox, TimePicker } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dhis2Client } from '../../api/dhis2Client';
import { getAllOrgUnits } from '../../services/unknownCase/create';
import { getDHIS2MetadataInfo } from '../../utils/dhis2MetadataUtils';

const { Title } = Typography;

interface RegisterFormData {
  occurredAt: dayjs.Dayjs;
  scheduledAt: dayjs.Dayjs;
  orgUnit: string;
  pushedToCase: boolean;
  pushedToEpi: boolean;
  pushedCaseId?: string;
  pushedToEmergency: boolean;
  emergencyDate?: dayjs.Dayjs;
  emergencyTime?: dayjs.Dayjs;
  pushCaseDate?: dayjs.Dayjs;
  pushCaseTime?: dayjs.Dayjs;
  pushEpiDate?: dayjs.Dayjs;
  pushEpiTime?: dayjs.Dayjs;
  status: string;
  completeEvent: boolean;
}

const EditUnknownCaseRegister = () => {
  const [form] = Form.useForm<RegisterFormData>();
  const navigate = useNavigate();
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusOptions, setStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (id && eventId) {
      loadData();
    }
  }, [id, eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载状态选项和组织机构
      const [optionSet, orgUnits] = await Promise.all([
        getDHIS2MetadataInfo('', '', '', 'OsUnkStat01'),
        getAllOrgUnits(),
      ]);

      const options = optionSet?.options?.map((option: any) => ({
        value: option.code,
        label: option.name,
      })) || [];

      setStatusOptions(options);
      setOrgUnitOptions(orgUnits.map((o) => ({ value: o.id, label: o.displayName })));

      // 加载事件数据
      const eventRes = await dhis2Client.get<any>(`/api/42/tracker/events/${eventId}`);

      if (!eventRes.event) {
        message.error('未找到该事件');
        navigate(`/unknown-cases/${id}`);
        return;
      }

      setEventData(eventRes);

      // 构建数据值映射
      const dvMap = new Map(eventRes.dataValues.map((dv: any) => [dv.dataElement, dv.value]));

      // 解析日期时间
      const parseDateTime = (dateTimeStr?: string) => {
        if (!dateTimeStr) return undefined;
        return dayjs(dateTimeStr);
      };

      const extractTime = (dateTimeStr?: string) => {
        if (!dateTimeStr) return undefined;
        const dt = dayjs(dateTimeStr);
        return dayjs().hour(dt.hour()).minute(dt.minute());
      };

      const emergencyDateTime = dvMap.get('DePushEmgDt');
      const pushCaseDateTime = dvMap.get('DePushCsDt1');
      const pushEpiDateTime = dvMap.get('DeUnkPshDt1');

      // 设置表单值
      form.setFieldsValue({
        occurredAt: eventRes.occurredAt ? dayjs(eventRes.occurredAt) : dayjs(),
        scheduledAt: eventRes.scheduledAt ? dayjs(eventRes.scheduledAt) : dayjs(),
        orgUnit: eventRes.orgUnit || '',
        pushedToCase: dvMap.get('DePushCase1') === 'true',
        pushedToEpi: dvMap.get('DeUnkPshEpi') === 'true',
        pushedCaseId: dvMap.get('DePushCsId1') || '',
        pushedToEmergency: dvMap.get('DePushEmg01') === 'true',
        emergencyDate: emergencyDateTime ? parseDateTime(emergencyDateTime) : undefined,
        emergencyTime: emergencyDateTime ? extractTime(emergencyDateTime) : undefined,
        pushCaseDate: pushCaseDateTime ? parseDateTime(pushCaseDateTime) : undefined,
        pushCaseTime: pushCaseDateTime ? extractTime(pushCaseDateTime) : undefined,
        pushEpiDate: pushEpiDateTime ? parseDateTime(pushEpiDateTime) : undefined,
        pushEpiTime: pushEpiDateTime ? extractTime(pushEpiDateTime) : undefined,
        status: dvMap.get('DeUnkStat01') || '',
        completeEvent: eventRes.status === 'COMPLETED',
      });
    } catch (e: any) {
      message.error(`加载数据失败: ${e.message}`);
      navigate(`/unknown-cases/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventData) {
      message.error('缺少必要数据');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 合并日期和时间
      const combineDateTime = (date?: dayjs.Dayjs, time?: dayjs.Dayjs) => {
        if (!date || !time) return undefined;
        return date.hour(time.hour()).minute(time.minute()).second(0).toISOString();
      };

      const emergencyTime = combineDateTime(values.emergencyDate, values.emergencyTime);
      const pushCaseTime = combineDateTime(values.pushCaseDate, values.pushCaseTime);
      const pushEpiTime = combineDateTime(values.pushEpiDate, values.pushEpiTime);

      // 构建更新载荷
      const payload = {
        events: [
          {
            event: eventData.event,
            status: values.completeEvent ? 'COMPLETED' : 'ACTIVE',
            program: eventData.program,
            programStage: eventData.programStage,
            enrollment: eventData.enrollment,
            trackedEntity: eventData.trackedEntity,
            orgUnit: values.orgUnit,
            occurredAt: values.occurredAt.format('YYYY-MM-DD'),
            scheduledAt: values.scheduledAt.format('YYYY-MM-DD'),
            dataValues: [
              { dataElement: 'DePushCase1', value: String(values.pushedToCase) },
              { dataElement: 'DeUnkPshEpi', value: String(values.pushedToEpi) },
              { dataElement: 'DePushCsId1', value: values.pushedCaseId || null },
              { dataElement: 'DePushEmg01', value: String(values.pushedToEmergency) },
              { dataElement: 'DePushEmgDt', value: emergencyTime || null },
              { dataElement: 'DePushCsDt1', value: pushCaseTime || null },
              { dataElement: 'DeUnkPshDt1', value: pushEpiTime || null },
              { dataElement: 'DeUnkStat01', value: values.status },
            ],
          },
        ],
      };

      await dhis2Client.post('/api/42/tracker', payload, { async: 'false', importStrategy: 'UPDATE' });

      message.success('不明病例登记更新成功！');
      navigate(`/unknown-cases/${id}`);
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/unknown-cases/${id}`);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑不明病例登记</Title>
        <Form form={form} layout="vertical">
          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Report date"
                name="occurredAt"
                rules={[{ required: true, message: '请选择Report date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Scheduled date" name="scheduledAt">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
              <Form.Item label="已推送个案管理" name="pushedToCase" valuePropName="checked">
                <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="已推送流调系统-3" name="pushedToEpi" valuePropName="checked">
                <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="推送个案ID" name="pushedCaseId">
                <Input placeholder="推送个案ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="已上报应急系统" name="pushedToEmergency" valuePropName="checked">
                <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="上报应急时间 (Date)" name="emergencyDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="emergencyTime">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="推送个案时间 (Date)" name="pushCaseDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="pushCaseTime">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="推送流调时间-3 (Date)" name="pushEpiDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="pushEpiTime">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="不明病例状态"
                name="status"
                rules={[{ required: true, message: '请选择不明病例状态' }]}
              >
                <Select placeholder="请选择状态" options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 24 }}>状态部分</Title>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="completeEvent" valuePropName="checked">
                <Checkbox>Complete event</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            保存
          </Button>
        </Space>
      </div>
    </Space>
  );
};

export default EditUnknownCaseRegister;