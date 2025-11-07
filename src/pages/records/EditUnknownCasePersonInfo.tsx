import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, DatePicker, Input, Row, Col, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dhis2Client } from '../../api/dhis2Client';
import { getAllOrgUnits } from '../../services/unknownCase/create';
import { getGenderOptionSet } from '../../services/unknownCase/meta';

const { Title } = Typography;

interface PersonInfoFormData {
  enrolledAt: dayjs.Dayjs;
  symptomDate: dayjs.Dayjs;
  fullName: string;
  nationalId?: string;
  gender: string;
  age: number;
  phone: string;
  address: string;
  caseNo: string;
  reportOrg: string;
  reportDate: dayjs.Dayjs;
  clinicalSymptoms: string;
  suspectedPathogen?: string;
}

const EditUnknownCasePersonInfo = () => {
  const [form] = Form.useForm<PersonInfoFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [teiData, setTeiData] = useState<any>(null);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载性别选项和组织机构
      const [genderOs, orgUnits] = await Promise.all([
        getGenderOptionSet(),
        getAllOrgUnits(),
      ]);
      
      setGenderOptions(genderOs.options.map((o) => ({ value: o.code, label: o.name })));
      setOrgUnitOptions(orgUnits.map((o) => ({ value: o.id, label: o.displayName })));

      // 加载TEI数据
      const teiRes = await dhis2Client.get<any>(`/api/tracker/trackedEntities/${id}`, {
        program: 'PrgUnknown1',
        fields: 'trackedEntity,trackedEntityType,orgUnit,attributes[attribute,value],enrollments[enrollment,enrolledAt,occurredAt,orgUnit]',
      });

      if (!teiRes.trackedEntity) {
        message.error('未找到该病例');
        navigate('/unknown-cases');
        return;
      }

      setTeiData(teiRes);
      const enrollment = teiRes.enrollments?.[0];
      setEnrollmentData(enrollment);

      // 构建属性映射
      const attrs = new Map(teiRes.attributes.map((a: any) => [a.attribute, a.value]));

      // 设置表单值
      form.setFieldsValue({
        enrolledAt: enrollment?.enrolledAt ? dayjs(enrollment.enrolledAt) : dayjs(),
        symptomDate: attrs.get('AtrSymptDt1') ? dayjs(attrs.get('AtrSymptDt1')) : dayjs(),
        fullName: attrs.get('AtrFullNm01') || '',
        nationalId: attrs.get('AtrNatnlId1') || '',
        gender: attrs.get('AtrGender01') || '',
        age: attrs.get('AtrAge00001') ? Number(attrs.get('AtrAge00001')) : 0,
        phone: attrs.get('AtrPhone001') || '',
        address: attrs.get('AtrAddr0001') || '',
        caseNo: attrs.get('AtrUnkNo001') || '',
        reportOrg: attrs.get('AtrRptOrg01') || '',
        reportDate: attrs.get('AtrRptDt001') ? dayjs(attrs.get('AtrRptDt001')) : dayjs(),
        clinicalSymptoms: attrs.get('AtrUnkSymp1') || '',
        suspectedPathogen: attrs.get('AtrUnkPath1') || '',
      });
    } catch (e: any) {
      message.error(`加载数据失败: ${e.message}`);
      navigate('/unknown-cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!teiData || !enrollmentData) {
      message.error('缺少必要数据');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 更新 Enrollment (报名登记部分)
      const enrollmentPayload = {
        enrollments: [
          {
            enrollment: enrollmentData.enrollment,
            trackedEntity: teiData.trackedEntity,
            program: 'PrgUnknown1',
            status: 'ACTIVE',
            orgUnit: teiData.orgUnit,
            enrolledAt: values.enrolledAt.format('YYYY-MM-DD'),
            occurredAt: values.symptomDate.toISOString(),
          },
        ],
      };

      await dhis2Client.post('/api/42/tracker', enrollmentPayload, { async: 'false', importStrategy: 'UPDATE' });

      // 更新 TrackedEntity (基本信息部分)
      const teiPayload = {
        trackedEntities: [
          {
            trackedEntity: teiData.trackedEntity,
            trackedEntityType: 'TetPerson01',
            orgUnit: teiData.orgUnit,
            attributes: [
              { attribute: 'AtrFullNm01', value: values.fullName },
              { attribute: 'AtrNatnlId1', value: values.nationalId || '' },
              { attribute: 'AtrGender01', value: values.gender },
              { attribute: 'AtrAge00001', value: String(values.age) },
              { attribute: 'AtrPhone001', value: values.phone },
              { attribute: 'AtrAddr0001', value: values.address },
              { attribute: 'AtrUnkNo001', value: values.caseNo },
              { attribute: 'AtrRptOrg01', value: values.reportOrg },
              { attribute: 'AtrRptDt001', value: values.reportDate.format('YYYY-MM-DD') },
              { attribute: 'AtrSymptDt1', value: values.symptomDate.format('YYYY-MM-DD') },
              { attribute: 'AtrUnkSymp1', value: values.clinicalSymptoms },
              { attribute: 'AtrUnkPath1', value: values.suspectedPathogen || '' },
            ],
          },
        ],
      };

      await dhis2Client.post('/api/42/tracker', teiPayload, { async: 'false' });

      message.success('个人资料更新成功！');
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
        <Title level={4}>编辑个人资料</Title>
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

          <Title level={5} style={{ marginTop: 24 }}>基本信息</Title>
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
                  { required: true, message: '请输入身份证号' },
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
              <Form.Item label="不明病例编号" name="caseNo" rules={[{ required: true, message: '不明病例编号不能为空' }]}>
                <Input disabled />
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

export default EditUnknownCasePersonInfo;