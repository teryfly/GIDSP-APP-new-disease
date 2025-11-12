import { Form, Input, Select, Row, Col, Card, Typography, Checkbox, Switch } from 'antd';
import type { FormInstance } from 'antd';
import type { DiseaseCodeFormData } from '../../types/forms';
import { listOptions as listCachedOptions } from '../../api/optionSets';
import { OPTION_SET_IDS } from '../../types/dhis2';

const { Title } = Typography;
const { Option } = Select;

interface DiseaseCodeFormProps {
  form: FormInstance<DiseaseCodeFormData>;
  initialValues?: DiseaseCodeFormData;
  disableCode?: boolean;
}

const DiseaseCodeForm = ({ form, initialValues, disableCode }: DiseaseCodeFormProps) => {
  const categories = listCachedOptions(OPTION_SET_IDS.DiseaseCategory);
  const risks = listCachedOptions(OPTION_SET_IDS.RiskLevel);
  const pathogens = listCachedOptions(OPTION_SET_IDS.Pathogens);

  return (
    <Card>
      <Title level={4}>疾病编码</Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isQuarantine: false, isActive: true, ...initialValues }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="疾病编码"
              name="diseaseCode"
              rules={[{ required: true, message: '请输入疾病编码' }, { min: 2, max: 200, message: '疾病编码长度2-200字' }]}
            >
              <Input placeholder="请输入疾病编码" disabled={disableCode} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="疾病名称"
              name="diseaseName"
              rules={[{ required: true, message: '请输入疾病名称', min: 2, max: 200 }]}
            >
              <Input placeholder="请输入疾病名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="疾病类别"
              name="diseaseCategory"
              rules={[{ required: true, message: '请选择疾病类别' }]}
            >
              <Select placeholder="请选择">
                {categories.map((c) => (
                  <Option key={c.code || c.id} value={c.code || c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="ICD编码"
              name="icdCode"
              rules={[{ max: 100, message: 'ICD编码过长' }]}
            >
              <Input placeholder="请输入ICD编码" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="疾病描述"
              name="description"
              rules={[{ max: 1000, message: '疾病描述不能超过1000字' }]}
            >
              <Input.TextArea rows={2} placeholder="请输入疾病描述" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="风险等级"
              name="riskLevel"
              rules={[{ required: true, message: '请选择风险等级' }]}
            >
              <Select placeholder="请选择">
                {risks.map((r) => (
                  <Option key={r.code || r.id} value={r.code || r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="是否检疫传染病"
              name="isQuarantine"
              valuePropName="checked"
            >
              <Checkbox>是</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="是否启用"
              name="isActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="关联病原体"
              name="relatedPathogens"
            >
              <Select mode="multiple" placeholder="请选择关联病原体">
                {pathogens.map((p) => (
                  <Option key={p.code || p.id} value={p.code || p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default DiseaseCodeForm;