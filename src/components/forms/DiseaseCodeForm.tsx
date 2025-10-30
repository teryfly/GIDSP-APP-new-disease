import { Form, Input, Select, Radio, Row, Col, Card, Typography, Checkbox, Switch } from 'antd';
import type { FormInstance } from 'antd';
import type { DiseaseCodeFormData } from '../../types/forms';
import { pathogens } from '../../data/pathogens'; // Assuming pathogens list for multi-select

const { Title } = Typography;
const { Option } = Select;

interface DiseaseCodeFormProps {
    form: FormInstance<DiseaseCodeFormData>;
    initialValues?: DiseaseCodeFormData;
}

const DiseaseCodeForm = ({ form, initialValues }: DiseaseCodeFormProps) => {
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
                            <Input placeholder="请输入疾病编码" />
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
                                <Option value="甲类">甲类</Option>
                                <Option value="乙类">乙类</Option>
                                <Option value="丙类">丙类</Option>
                                <Option value="其他">其他</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="ICD编码"
                            name="icdCode"
                            rules={[{ pattern: /^[A-Z]\d{2}(\.\d)?$/, message: '请输入正确的ICD编码格式 (如 A00.1)' }]}
                        >
                            <Input placeholder="请输入ICD-10编码" />
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
                            <Radio.Group>
                                <Radio value="高">高</Radio>
                                <Radio value="中">中</Radio>
                                <Radio value="低">低</Radio>
                            </Radio.Group>
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
                                {pathogens.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        {p.name} ({p.scientificName})
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