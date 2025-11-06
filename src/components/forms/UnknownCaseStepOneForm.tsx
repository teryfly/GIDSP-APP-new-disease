import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Card, Typography, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { getAllOrgUnits } from '../../services/unknownCase/create';
import { getGenderOptionSet } from '../../services/unknownCase/meta';

const { Title } = Typography;

export interface StepOneFormData {
  enrolledAt: dayjs.Dayjs; // 登记日期
  symptomDate: dayjs.Dayjs; // 症状起始日期
  fullName: string;
  nationalId?: string;
  gender: string;
  age: number;
  phone: string;
  address: string;
  caseNo: string; // 将在提交时生成
  reportOrg: string;
  reportDate: dayjs.Dayjs;
  clinicalSymptoms: string;
  suspectedPathogen?: string;
}

interface Props {
  form: FormInstance<StepOneFormData>;
  orgUnit: string; // 从列表页传入的报告单位
}

const UnknownCaseStepOneForm = ({ form, orgUnit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 加载性别选项
      const genderOs = await getGenderOptionSet();
      setGenderOptions(genderOs.options.map((o) => ({ value: o.code, label: o.name })));

      // 加载组织机构列表
      const orgUnits = await getAllOrgUnits();
      setOrgUnitOptions(orgUnits.map((o) => ({ value: o.id, label: o.displayName })));

      // 设置默认值 - 不明病例编号将在提交时生成
      form.setFieldsValue({
        enrolledAt: dayjs(),
        reportDate: dayjs(),
        caseNo: '系统将自动生成',
      });
    } catch (e: any) {
      message.error(`加载初始数据失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Card>
      <Title level={4}>第一步：基本信息</Title>
      <Form form={form} layout="vertical">
        <Title level={5}>报名登记部分</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="登记日期"
              name="enrolledAt"
              rules={[{ required: true, message: '请选择登记日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="症状起始日期"
              name="symptomDate"
              rules={[{ required: true, message: '请选择症状起始日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: 24 }}>基本信息部分</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="姓名"
              name="fullName"
              rules={[{ required: true, message: '请输入姓名', min: 2, max: 50 }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="身份证号"
              name="nationalId"
              rules={[
                { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' },
              ]}
            >
              <Input placeholder="请输入身份证号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
              <Select placeholder="请选择性别" options={genderOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="年龄"
              name="age"
              rules={[
                { required: true, message: '请输入年龄' },
                {
                  type: 'number',
                  min: 0,
                  max: 150,
                  transform: (value) => Number(value),
                  message: '年龄必须在0-150之间',
                },
              ]}
            >
              <Input suffix="岁" placeholder="请输入年龄" type="number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="住址"
              name="address"
              rules={[{ required: true, message: '请输入住址', min: 5, max: 500 }]}
            >
              <Input.TextArea rows={2} placeholder="请输入住址" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="不明病例编号" name="caseNo">
              <Input disabled placeholder="提交时自动生成" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="报告机构"
              name="reportOrg"
              rules={[{ required: true, message: '请选择报告机构' }]}
            >
              <Select
                showSearch
                placeholder="请选择报告机构"
                options={orgUnitOptions}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="报告日期"
              name="reportDate"
              rules={[{ required: true, message: '请选择报告日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="临床症状描述"
              name="clinicalSymptoms"
              rules={[{ required: true, message: '请输入临床症状描述', min: 20, max: 2000 }]}
            >
              <Input.TextArea rows={3} placeholder="请详细描述临床症状" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="疑似病原体" name="suspectedPathogen" rules={[{ max: 200, message: '疑似病原体不能超过200字' }]}>
              <Input placeholder="请输入疑似病原体" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default UnknownCaseStepOneForm;