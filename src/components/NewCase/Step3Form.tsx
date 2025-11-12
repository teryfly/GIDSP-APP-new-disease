import { Form, Input, Select, DatePicker, Row, Col, Typography, Divider, Checkbox } from 'antd';

const { Title } = Typography;

const Step3Form = () => {
    return (
        <Form layout="vertical">
            <Title level={4}>诊断信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="初步诊断" name="initialDiagnosis" rules={[{ required: true }]}>
                        <Input placeholder="请输入初步诊断" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="确诊诊断" name="finalDiagnosis">
                        <Input placeholder="请输入确诊诊断" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="诊断日期" name="diagnosisDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="个案来源" name="caseSource" rules={[{ required: true }]}>
                        <Select placeholder="请选择来源">
                            <Select.Option value="active">主动监测</Select.Option>
                            <Select.Option value="passive">被动报告</Select.Option>
                            <Select.Option value="unknown">不明原因转入</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item label="症状描述" name="symptoms">
                         <Checkbox.Group style={{ width: '100%' }}>
                            <Row>
                                <Col span={8}><Checkbox value="fever">发热</Checkbox></Col>
                                <Col span={8}><Checkbox value="cough">咳嗽</Checkbox></Col>
                                <Col span={8}><Checkbox value="fatigue">乏力</Checkbox></Col>
                                <Col span={8}><Checkbox value="soreThroat">咽痛</Checkbox></Col>
                                <Col span={8}><Checkbox value="headache">头痛</Checkbox></Col>
                                <Col span={8}><Checkbox value="diarrhea">腹泻</Checkbox></Col>
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Col>
                 <Col span={24}>
                    <Form.Item label="其他症状" name="otherSymptoms">
                        <Input.TextArea rows={3} placeholder="请描述其他症状" />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

export default Step3Form;