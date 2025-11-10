import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Radio, Input, Row, Col, Select, Tooltip, Checkbox, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEvent, getCaseDetails, updateEvents } from '../../services/caseDetailsService';
import { getAllOrgUnits } from '../../services/caseService';
import { getMe, getOrgUnitsByPath } from '../../services/caseService2';
import { toTrackingForm, buildTrackingUpdateDVs } from '../../services/mappers/eventFormMappers';
import { PS } from '../../services/contractMapping';
import { validateNotFuture, validateDateRange } from '../../utils/dateValidators';
import type { OrgUnit } from '../../services/caseService';

const { Title } = Typography;
const { TextArea } = Input;

interface RegionOption {
  value: string;
  label: string;
}

const EditTrackingRecord = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { caseId, id } = useParams<{ caseId: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ value: string; label: string }[]>([]);

  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [orgUnit, setOrgUnit] = useState<string | null>(null);

  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [statusCompleted, setStatusCompleted] = useState<boolean>(false);

  const trackingType = Form.useWatch('trackingType', form);

  useEffect(() => {
    if (!caseId || !id) {
      message.error('缺少必要参数');
      navigate('/cases');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        // 并行加载事件数据、个案详情、机构数据和区域数据
        const [event, tei, orgUnits, me] = await Promise.all([
          getEvent(id),
          getCaseDetails(caseId),
          getAllOrgUnits(),
          getMe()
        ]);
        
        const enr = tei.enrollments?.[0];
        if (!enr) {
          message.error('该个案没有入组记录');
          navigate(`/cases/${caseId}`);
          return;
        }
        setEnrollment(enr.enrollment);
        setOrgUnit(event.orgUnit);
        setStatusCompleted(event.status === 'COMPLETED');
        
        // 设置机构选项
        setOrgUnitOptions(orgUnits.map((o: OrgUnit) => ({ value: o.id, label: o.name })));

        const mapped = toTrackingForm(event.dataValues || []);
        form.setFieldsValue({
          occurredAt: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
          orgUnit: event.orgUnit,
          ...mapped,
          pushedToEpi: String(mapped.pushedToEpi || '') === 'true',
          pushEpiDateTime: mapped.pushEpiDateTime ? dayjs(mapped.pushEpiDateTime) : undefined,
        });

        setRegionLoading(true);
        const path = me.organisationUnits?.[0]?.path || '';
        const parentPath = path.substring(0, path.lastIndexOf('/')) || path;
        const ous = await getOrgUnitsByPath(parentPath);
        const opts = (ous || []).map((ou) => ({ value: ou.id, label: ou.name }));
        setRegionOptions(opts);
      } catch (e: any) {
        message.error(`加载失败: ${e.message}`);
        navigate(`/cases/${caseId}`);
      } finally {
        setRegionLoading(false);
        setLoading(false);
      }
    })();
  }, [caseId, id, navigate, form]);

  const handleSubmit = async () => {
    if (!enrollment || !orgUnit || !id) {
      message.error('缺少必要的上下文信息（入组或机构或事件ID）');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const occurred = values.occurredAt?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');

      const start = values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined;
      const end = values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined;

      const dvs = buildTrackingUpdateDVs({
        trackingType: values.trackingType,
        startDate: start,
        endDate: end,
        regionId: values.regionId,
        locationDescription: values.locationDescription,
        contactPersons: values.contactPersons,
        exposureDetails: values.exposureDetails,
        riskAssessment: values.riskAssessment,
        pushedToEpi: values.pushedToEpi,
        pushEpiDateTime: values.pushEpiDateTime ? values.pushEpiDateTime.toISOString() : undefined,
      });

      const res = await updateEvents([
        {
          event: id,
          program: 'PrgCaseMgt1',
          programStage: PS.TRACKING,
          enrollment,
          orgUnit: values.orgUnit, // 使用表单中选择的机构
          status: statusCompleted ? 'COMPLETED' : 'ACTIVE',
          occurredAt: occurred,
          dataValues: dvs,
        },
      ] as any);

      if (res.status === 'OK') {
        message.success('追踪记录更新成功!');
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

  const handleCancel = () => {
    navigate(`/cases/${caseId}`);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑追踪记录</Title>
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

            <Col span={24}>
              <Form.Item
                label="地点描述"
                name="locationDescription"
                rules={[{ required: true, message: '请输入地点描述' }, { min: 10, max: 500 }]}
              >
                <TextArea rows={2} placeholder="请输入地点描述" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="结束日期"
                name="endDate"
                rules={[{ required: true, message: '请选择结束日期' }, { validator: validateNotFuture }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="接触人员" name="contactPersons" rules={[{ max: 1000, message: '接触人员信息不能超过1000字' }]}>
                <TextArea rows={2} placeholder="请输入接触人员信息" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="暴露详情"
                name="exposureDetails"
                rules={[{ required: true, message: '请输入暴露详情' }, { min: 10, max: 1000 }]}
              >
                <TextArea rows={3} placeholder="请输入暴露详情" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="已推送流调系统-2" name="pushedToEpi" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="关联地区" name="regionId" rules={[{ required: true, message: '请选择关联地区' }]}>
                <Select
                  placeholder="请选择地区"
                  loading={regionLoading}
                  options={regionOptions}
                  showSearch
                  filterOption={(input, option) => ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="起始日期"
                name="startDate"
                rules={[
                  { required: true, message: '请选择起始日期' },
                  ({ getFieldValue }) => ({
                    validator: validateDateRange(() => getFieldValue('startDate'), '结束日期不能早于开始日期'),
                  }),
                  { validator: validateNotFuture },
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="风险评估" name="riskAssessment" rules={[{ required: true, message: '请选择风险评估' }]}>
                <Radio.Group>
                  <Radio value="HIGH">高风险</Radio>
                  <Radio value="MEDIUM">中风险</Radio>
                  <Radio value="LOW">低风险</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="推送流调时间-2" name="pushEpiDateTime">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="追踪类型" name="trackingType" rules={[{ required: true, message: '请选择追踪类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="TRAVEL_HISTORY">旅居史</Select.Option>
                  <Select.Option value="CONTACT_HISTORY">接触史</Select.Option>
                  <Select.Option value="ITEM_EXPOSURE">物品暴露史</Select.Option>
                  <Select.Option value="PLACE_EXPOSURE">场所暴露史</Select.Option>
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

export default EditTrackingRecord;