import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Input, Row, Col, Select, Checkbox } from 'antd';
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
  emergencyTime?: string;
  pushCaseDate?: dayjs.Dayjs;
  pushCaseTime?: string;
  pushEpiDate?: dayjs.Dayjs;
  pushEpiTime?: string;
  status: string;
  completeEvent: boolean;
  
  // 新增属性（当pushedToEmergency为true时显示）
  alertId?: string;        // 预警ID
  alertTitle?: string;     // 标题
  alertContent?: string;   // 内容
  alertTypeName?: string;  // 预警类型名称
  alertSource?: string;    // 来源（固定值为"SCLOWCODE"）
  alertDateTime?: dayjs.Dayjs; // 预警时间（日期部分）
  alertTime?: string;      // 预警时间（时间部分）
  alertEventId?: string;   // 事件ID
  alertModifyType?: string; // 添加或修改类型
  alertStatus?: string;    // 预警状态
}

export const EditUnknownCaseRegister: React.FC = () => {
  const [form] = Form.useForm();
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<any[]>([]);
  const [modifyTypeOptions, setModifyTypeOptions] = useState<any[]>([]);
  const [alertStatusOptions, setAlertStatusOptions] = useState<any[]>([]);
  
  // 用于控制新增属性的显示
  const [pushedToEmergency, setPushedToEmergency] = useState<boolean>(false);
  
  // 获取表单值以判断是否显示新增属性
  const pushedToEmergencyValue = Form.useWatch('pushedToEmergency', form);

  useEffect(() => {
    if (id && eventId) {
      loadData();
    }
  }, [id, eventId]);

  const loadData = async () => {
    if (!id || !eventId) return;
    
    setLoading(true);
    try {
      // 并行加载所有需要的数据
      const results = await Promise.allSettled([
        getDHIS2MetadataInfo('', '', '', 'OsUnkStat01'),
        getAllOrgUnits(),
        dhis2Client.get<any>('/api/29/optionSets/Oskn9LFm9QF?fields=%3Aall%2CattributeValues%5B%3Aall%2Cattribute%5Bid%2Cname%2CdisplayName%5D%5D%2Coptions%5Bid%2Cname%2CdisplayName%2Ccode%2Cstyle%5D'),
        dhis2Client.get<any>('/api/29/optionSets/BhfOVWv5NbH?fields=%3Aall%2CattributeValues%5B%3Aall%2Cattribute%5Bid%2Cname%2CdisplayName%5D%5D%2Coptions%5Bid%2Cname%2CdisplayName%2Ccode%2Cstyle%5D'),
        dhis2Client.get<any>(`/api/42/tracker/events/${eventId}`)
      ]);

      // 处理状态选项
      const optionSetResult = results[0];
      if (optionSetResult.status === 'fulfilled' && optionSetResult.value) {
        const options = optionSetResult.value.options?.map((option: any) => ({
          value: option.code,
          label: option.name,
        })) || [];
        setStatusOptions(options);
      }

      // 处理组织机构选项
      const orgUnitsResult = results[1];
      if (orgUnitsResult.status === 'fulfilled') {
        setOrgUnitOptions(orgUnitsResult.value.map((o: any) => ({ value: o.id, label: o.displayName })));
      }

      // 处理添加或修改类型选项
      const modifyTypeSetResult = results[2];
      if (modifyTypeSetResult.status === 'fulfilled' && modifyTypeSetResult.value) {
        const modifyTypeOpts = modifyTypeSetResult.value.options?.map((option: any) => ({
          value: option.code,
          label: option.name,
        })) || [];
        setModifyTypeOptions(modifyTypeOpts);
      }

      // 处理预警状态选项
      const alertStatusSetResult = results[3];
      if (alertStatusSetResult.status === 'fulfilled' && alertStatusSetResult.value) {
        const alertStatusOpts = alertStatusSetResult.value.options?.map((option: any) => ({
          value: option.code,
          label: option.name,
        })) || [];
        setAlertStatusOptions(alertStatusOpts);
      }

      // 处理事件数据
      const eventResult = results[4];
      if (eventResult.status === 'rejected') {
        throw new Error('加载事件数据失败');
      }

      const eventRes = eventResult.value;
      if (!eventRes.event) {
        message.error('未找到该事件');
        navigate(`/unknown-cases/${id}`);
        return;
      }

      setEventData(eventRes);

      // 构建数据值映射
      const dvMap = new Map(eventRes.dataValues.map((dv: any) => [dv.dataElement, dv.value]));

      // 解析日期时间
      const parseDateTime = (dateTimeStr?: string): dayjs.Dayjs | undefined => {
        if (!dateTimeStr) return undefined;
        return dayjs(dateTimeStr);
      };

      const extractTime = (dateTimeStr?: string): string | undefined => {
        if (!dateTimeStr) return undefined;
        const dt = dayjs(dateTimeStr);
        return dt.format('HH:mm');
      };

      const emergencyDateTime = dvMap.get('DePushEmgDt') as string | undefined;
      const pushCaseDateTime = dvMap.get('DePushCsDt1') as string | undefined;
      const pushEpiDateTime = dvMap.get('DeUnkPshDt1') as string | undefined;

      // 解析新增属性的值
      const alertDateTimeStr = dvMap.get('O5kMFPyrkmj') as string | undefined; // 预警时间
      const alertDateTime: dayjs.Dayjs | undefined = alertDateTimeStr ? parseDateTime(alertDateTimeStr) : undefined;
      const alertTime: string | undefined = alertDateTimeStr ? extractTime(alertDateTimeStr) : undefined;

      // 设置表单值
      const pushedToEmergencyValue = dvMap.get('DePushEmg01') === 'true';
      setPushedToEmergency(pushedToEmergencyValue);
      
      form.setFieldsValue({
        occurredAt: eventRes.occurredAt ? dayjs(eventRes.occurredAt) : dayjs(),
        scheduledAt: eventRes.scheduledAt ? dayjs(eventRes.scheduledAt) : dayjs(),
        orgUnit: eventRes.orgUnit || '',
        pushedToCase: dvMap.get('DePushCase1') === 'true',
        pushedToEpi: dvMap.get('DeUnkPshEpi') === 'true',
        pushedCaseId: (dvMap.get('DePushCsId1') as string | undefined) || '',
        pushedToEmergency: pushedToEmergencyValue,
        emergencyDate: emergencyDateTime ? parseDateTime(emergencyDateTime) : undefined,
        emergencyTime: emergencyDateTime ? extractTime(emergencyDateTime) : undefined,
        pushCaseDate: pushCaseDateTime ? parseDateTime(pushCaseDateTime) : undefined,
        pushCaseTime: pushCaseDateTime ? extractTime(pushCaseDateTime) : undefined,
        pushEpiDate: pushEpiDateTime ? parseDateTime(pushEpiDateTime) : undefined,
        pushEpiTime: pushEpiDateTime ? extractTime(pushEpiDateTime) : undefined,
        status: (dvMap.get('DeUnkStat01') as string | undefined) || '',
        completeEvent: eventRes.status === 'COMPLETED',
        
        // 新增属性
        alertId: (dvMap.get('a4N9z9gZaJc') as string | undefined) || '',
        alertTitle: (dvMap.get('rG1gIAVrgKK') as string | undefined) || '',
        alertContent: (dvMap.get('pjYdGWLER7d') as string | undefined) || '',
        alertTypeName: (dvMap.get('liKIghiuKTt') as string | undefined) || '',
        alertSource: (dvMap.get('m9Pa8zeSCNG') as string | undefined) || 'SCLOWCODE', // 固定值
        alertDateTime: alertDateTime,
        alertTime: alertTime,
        alertEventId: (dvMap.get('QOk13DNk20K') as string | undefined) || '',
        alertModifyType: (dvMap.get('wOlEjbF6Ija') as string | undefined) || '',
        alertStatus: (dvMap.get('YAhyASn12MH') as string | undefined) || '',
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
      const combineDateTime = (date?: dayjs.Dayjs, time?: string): string | undefined => {
        if (!date || !time) return undefined;
        // 解析时间字符串 (HH:mm)
        const [hours, minutes] = time.split(':').map(Number);
        return date.hour(hours).minute(minutes).second(0).millisecond(0).toISOString();
      };

      const emergencyTime = combineDateTime(values.emergencyDate, values.emergencyTime);
      const pushCaseTime = combineDateTime(values.pushCaseDate, values.pushCaseTime);
      const pushEpiTime = combineDateTime(values.pushEpiDate, values.pushEpiTime);
      
      // 合并预警时间
      const alertTime = values.pushedToEmergency 
        ? combineDateTime(values.alertDateTime, values.alertTime) 
        : undefined;

      // 构建基础数据值数组
      const dataValues: Array<{ dataElement: string; value: string | null }> = [
        { dataElement: 'DePushCase1', value: String(values.pushedToCase) },
        { dataElement: 'DeUnkPshEpi', value: String(values.pushedToEpi) },
        { dataElement: 'DePushCsId1', value: values.pushedCaseId || null },
        { dataElement: 'DePushEmg01', value: String(values.pushedToEmergency) },
        { dataElement: 'DePushEmgDt', value: emergencyTime || null },
        { dataElement: 'DePushCsDt1', value: pushCaseTime || null },
        { dataElement: 'DeUnkPshDt1', value: pushEpiTime || null },
        { dataElement: 'DeUnkStat01', value: values.status },
      ];

      // 仅当已上报应急系统为true时，添加新增属性
      if (values.pushedToEmergency) {
        dataValues.push(
          { dataElement: 'a4N9z9gZaJc', value: values.alertId || null },      // 预警ID
          { dataElement: 'rG1gIAVrgKK', value: values.alertTitle || null },   // 标题
          { dataElement: 'pjYdGWLER7d', value: values.alertContent || null }, // 内容
          { dataElement: 'liKIghiuKTt', value: values.alertTypeName || null }, // 预警类型名称
          { dataElement: 'm9Pa8zeSCNG', value: values.alertSource || 'SCLOWCODE' }, // 来源
          { dataElement: 'O5kMFPyrkmj', value: alertTime || null },          // 预警时间
          { dataElement: 'QOk13DNk20K', value: values.alertEventId || null }, // 事件ID
          { dataElement: 'wOlEjbF6Ija', value: values.alertModifyType || null }, // 添加或修改类型
          { dataElement: 'YAhyASn12MH', value: values.alertStatus || null }   // 预警状态
        );
      }

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
            dataValues: dataValues,
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

  const onValuesChange = (changedValues: any) => {
    if ('pushedToEmergency' in changedValues) {
      setPushedToEmergency(changedValues.pushedToEmergency);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑不明病例登记</Title>
        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <Title level={5}>基本信息部分</Title>
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
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Organisation unit" name="orgUnit">
                <Select 
                  placeholder="请选择组织机构" 
                  options={orgUnitOptions} 
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
            
            {/* 新增属性，仅在已上报应急系统为YES时显示 */}
            {pushedToEmergencyValue === true && (
              <>
                <Col span={12}>
                  <Form.Item label="预警ID" name="alertId">
                    <Input placeholder="预警ID" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="标题" name="alertTitle">
                    <Input placeholder="标题" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="内容" name="alertContent">
                    <Input placeholder="内容" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="预警类型名称" name="alertTypeName">
                    <Input placeholder="预警类型名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="来源" name="alertSource">
                    <Input placeholder="来源" disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="预警时间 (Date)" name="alertDateTime">
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="Time" name="alertTime">
                    <Input placeholder="8:00" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="事件ID" name="alertEventId">
                    <Input placeholder="事件ID" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="添加或修改类型" name="alertModifyType">
                    <Select 
                      placeholder="请选择添加或修改类型" 
                      options={modifyTypeOptions} 
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="预警状态" name="alertStatus">
                    <Select 
                      placeholder="请选择预警状态" 
                      options={alertStatusOptions} 
                    />
                  </Form.Item>
                </Col>
              </>
            )}
            
            <Col span={8}>
              <Form.Item label="上报应急时间 (Date)" name="emergencyDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="emergencyTime">
                <Input placeholder="8:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="推送个案时间 (Date)" name="pushCaseDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="pushCaseTime">
                <Input placeholder="8:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="推送流调时间-3 (Date)" name="pushEpiDate">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Time" name="pushEpiTime">
                <Input placeholder="8:00" />
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