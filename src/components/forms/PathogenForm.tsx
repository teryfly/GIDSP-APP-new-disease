import { Form, Input, Select, Radio, Row, Col, Card, Typography, Switch } from 'antd';
import type { FormInstance } from 'antd';
import type { PathogenFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface PathogenFormProps {
    form: FormInstance<PathogenFormData>;
    initialValues?: PathogenFormData;
}

const PathogenForm = ({ form, initialValues }: PathogenFormProps) => {
    return (
        <Card>
            <Title level={4}>病原体信息</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ isActive: true, ...initialValues }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="病原体编码"
                            name="pathogenCode"
                            rules={[{ required: true, message: '请输入病原体编码' }, { min: 2, max: 200, message: '病原体编码长度2-200字' }]}
                        >
                            <Input placeholder="请输入病原体编码" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="病原体名称"
                            name="pathogenName"
                            rules={[{ required: true, message: '请输入病原体名称', min: 2, max: 200 }]}
                        >
                            <Input placeholder="请输入病原体名称" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="病原体类型"
                            name="pathogenType"
                            rules={[{ required: true, message: '请选择病原体类型' }]}
                        >
                            <Select placeholder="请选择">
                                <Option value="病毒">病毒</Option>
                                <Option value="细菌">细菌</Option>
                                <Option value="真菌">真菌</Option>
                                <Option value="寄生虫">寄生虫</Option>
                                <Option value="其他">其他</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="学名"
                            name="scientificName"
                            rules={[{ max: 200, message: '学名不能超过200字' }]}
                        >
                            <Input placeholder="请输入学名" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="相关疾病"
                            name="associatedDiseases"
                            rules={[{ max: 1000, message: '相关疾病描述不能超过1000字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入相关疾病（如：霍乱、鼠疫）" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="病原体描述"
                            name="description"
                            rules={[{ max: 1000, message: '病原体描述不能超过1000字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入病原体描述" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="生物安全等级"
                            name="biosafettyLevel"
                            rules={[{ required: true, message: '请选择生物安全等级' }]}
                        >
                            <Select placeholder="请选择">
                                <Option value="BSL-1">BSL-1</Option>
                                <Option value="BSL-2">BSL-2</Option>
                                <Option value="BSL-3">BSL-3</Option>
                                <Option value="BSL-4">BSL-4</Option>
                            </Select>
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
                </Row>
            </Form>
        </Card>
    );
};

export default PathogenForm;