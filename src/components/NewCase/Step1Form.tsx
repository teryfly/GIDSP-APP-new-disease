import { Form, Input, Select, DatePicker, Row, Col, Radio, Typography, Divider } from 'antd';

const { Title } = Typography;

const Step1Form = () => {
    return (
        <Form layout="vertical">
            <Title level={4}>患者基本信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item label="疾病类型" name="diseaseType" rules={[{ required: true, message: '请选择疾病类型' }]}>
                        <Select placeholder="请选择疾病" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="患者姓名" name="patientName" rules={[{ required: true, message: '请输入患者姓名' }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                        <Radio.Group>
                            <Radio value="male">男</Radio>
                            <Radio value="female">女</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="身份证号" name="idCard" rules={[{ required: true, message: '请输入身份证号' }]} help="系统将自动检测重复病例">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="出生日期" name="dob">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="年龄" name="age">
                        <Input suffix="岁" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item label="现住地址" name="address" rules={[{ required: true, message: '请输入现住地址' }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Col>
            </Row>
            <Title level={4} style={{ marginTop: 24 }}>报告信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="报告单位" name="reportUnit" initialValue="北京市朝阳区疾控中心">
                        <Input readOnly />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="报告人员" name="reporter" initialValue="李医生">
                        <Input readOnly />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="报告日期" name="reportDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="症状开始日期" name="symptomOnsetDate" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

export default Step1Form;