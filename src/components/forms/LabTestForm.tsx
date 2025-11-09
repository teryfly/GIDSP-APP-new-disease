import { useEffect, useState } from 'react';
import { Form, Input, DatePicker, Select, Row, Col, Card, Typography, Checkbox, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import type { LabTestFormData } from '../../types/labTest';
import { getDHIS2MetadataInfo } from '../../utils/dhis2MetadataUtils';
import { getAllOrgUnits } from '../../services/unknownCase/create';

const { Title } = Typography;

interface LabTestFormProps {
  form: FormInstance<LabTestFormData>;
  initialValues?: Partial<LabTestFormData>;
  mode: 'create' | 'edit';
  defaultOrgUnit?: string;
}

const LabTestForm = ({ form, initialValues, mode, defaultOrgUnit }: LabTestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [testTypeOptions, setTestTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [sampleTypeOptions, setSampleTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [testStatusOptions, setTestStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [testResultOptions, setTestResultOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [pathogenOptions, setPathogenOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      // 加载选项集
      const [testTypeOs, sampleTypeOs, testStatusOs, testResultOs, pathogenOs, orgUnits] = await Promise.all([
        getDHIS2MetadataInfo('', '', '', 'OsTestType1'),
        getDHIS2MetadataInfo('', '', '', 'OsSampleTp1'),
        getDHIS2MetadataInfo('', '', '', 'OsTestStat1'),
        getDHIS2MetadataInfo('', '', '', 'OsTestRslt1'),
        getDHIS2MetadataInfo('', '', '', 'OsPathogen1'),
        getAllOrgUnits(),
      ]);

      setTestTypeOptions(testTypeOs?.options?.map((o: any) => ({ value: o.code, label: o.name })) || []);
      setSampleTypeOptions(sampleTypeOs?.options?.map((o: any) => ({ value: o.code, label: o.name })) || []);
      setTestStatusOptions(testStatusOs?.options?.map((o: any) => ({ value: o.code, label: o.name })) || []);
      setTestResultOptions(testResultOs?.options?.map((o: any) => ({ value: o.code, label: o.name })) || []);
      setPathogenOptions(pathogenOs?.options?.map((o: any) => ({ value: o.code, label: o.name })) || []);
      setOrgUnitOptions(orgUnits.map((o) => ({ value: o.id, label: o.displayName })));

      // 设置默认值
      if (mode === 'create') {
        form.setFieldsValue({
          occurredAt: dayjs(),
          scheduledAt: dayjs(),
          orgUnit: defaultOrgUnit || '',
          completeEvent: false,
          ...initialValues,
        });
      } else {
        form.setFieldsValue(initialValues as LabTestFormData);
      }
    } catch (e: any) {
      message.error(`加载元数据失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Card>
      <Title level={5}>基本信息</Title>
      <Form form={form} layout="vertical">
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
            <Form.Item
              label="检测类型-2"
              name="testType"
              rules={[{ required: true, message: '请选择检测类型' }]}
            >
              <Select placeholder="请选择检测类型" options={testTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="样本采集日期-2"
              name="sampleCollectionDate"
              rules={[{ required: true, message: '请选择样本采集日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="检测状态-2"
              name="testStatus"
              rules={[{ required: true, message: '请选择检测状态' }]}
            >
              <Select placeholder="请选择检测状态" options={testStatusOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="确诊疾病名称" name="confirmedDiseaseName">
              <Input placeholder="请输入确诊疾病名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="检测日期-2" name="testDate">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="检测结果-2" name="testResult">
              <Select placeholder="请选择检测结果" options={testResultOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="检测编号-2"
              name="testNo"
              rules={[{ required: true, message: '请输入检测编号' }]}
            >
              <Input placeholder="请输入检测编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="实验室报告URL-2"
              name="labReportUrl"
              rules={[
                {
                  type: 'url',
                  message: '请提供有效的URL',
                },
              ]}
            >
              <Input placeholder="请输入实验室报告URL" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="检测机构-2" name="testOrgName">
              <Input placeholder="请输入检测机构" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="确认的病原体" name="confirmedPathogen">
              <Select placeholder="请选择确认的病原体" options={pathogenOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="样本类型-2"
              name="sampleType"
              rules={[{ required: true, message: '请选择样本类型' }]}
            >
              <Select placeholder="请选择样本类型" options={sampleTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="结果详情-2" name="resultDetails">
              <Input.TextArea rows={3} placeholder="请输入结果详情" />
            </Form.Item>
          </Col>
          {mode === 'edit' && (
            <Col span={24}>
              <Form.Item name="completeEvent" valuePropName="checked">
                <Checkbox>Complete event</Checkbox>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Card>
  );
};

export default LabTestForm;