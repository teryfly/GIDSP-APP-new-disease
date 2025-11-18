import { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Row, Col, Card, Typography, Checkbox, Input, message, Spin, TimePicker } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { getUnknownStatusOptions } from '../../services/unknownCase/create';
import { dhis2Client } from '../../api/dhis2Client';

const { Title } = Typography;

export interface StepTwoFormData {
  occurredAt: dayjs.Dayjs; // Report date
  scheduledAt: dayjs.Dayjs; // Scheduled date (今天，不可更改)
  pushedToCase: boolean;
  pushedToEpi: boolean;
  pushedCaseId?: string;
  pushedToEmergency: number; // 修改为数字类型：1表示是，2表示否
  emergencyDate?: dayjs.Dayjs;
  emergencyTime?: string;
  pushCaseDate?: dayjs.Dayjs;
  pushCaseTime?: string;
  pushEpiDate?: dayjs.Dayjs;
  pushEpiTime?: string;
  status: string; // 不明病例状态 code
  completeEvent: boolean;
  
  // 新增属性（当pushedToEmergency为1时显示）
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

interface Props {
  form: FormInstance<StepTwoFormData>;
  orgUnit: string;
}

const UnknownCaseStepTwoForm = ({ form, orgUnit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [modifyTypeOptions, setModifyTypeOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '0', label: '默认' },
    { value: '1', label: '添加' },
    { value: '2', label: '修改' }
  ]);
  const [alertStatusOptions, setAlertStatusOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '1', label: '预警中' },
    { value: '2', label: '已结束' }
  ]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 只加载状态选项，不再加载添加或修改类型和预警状态选项
      const statusOptions = await getUnknownStatusOptions();
      const options = statusOptions.map((o: any) => ({ value: o.code, label: o.displayName }));
      setStatusOptions(options);

      // 设置默认值 - 使用 dayjs 对象
      form.setFieldsValue({
        scheduledAt: dayjs(),
        pushedToCase: false,
        pushedToEpi: false,
        pushedToEmergency: 2, // 修改为数字类型：2表示否
        completeEvent: false,
        alertSource: 'SCLOWCODE' // 固定值
      });
    } catch (e: any) {
      message.error(`加载初始数据失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取表单值以判断是否显示新增属性
  const pushedToEmergency = Form.useWatch('pushedToEmergency', form);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Card>
      <Title level={4}>第二步：不明病例登记</Title>
      <Form form={form} layout="vertical">
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
            <Form.Item label="Organisation unit">
              <Input value={orgUnit} disabled />
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
              <Select options={[{ value: 1, label: '是' }, { value: 2, label: '否' }]} />
            </Form.Item>
          </Col>
          
          {/* 新增属性，仅在已上报应急系统为是时显示 */}
          {pushedToEmergency === 1 && (
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
  );
};

export default UnknownCaseStepTwoForm;