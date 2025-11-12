import { Form, Input, DatePicker, Row, Col, Radio, Typography, Divider, Card } from 'antd';

const { Title } = Typography;

const Step2Form = () => {
    return (
        <Form layout="vertical">
            <Title level={4}>流行病学信息</Title>
            <Divider />

            <Card title="暴露史" style={{ marginBottom: 24 }}>
                <Form.Item label="是否有疫区暴露史?">
                    <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="暴露详情">
                    <Input.TextArea rows={3} placeholder="请详细描述暴露史" />
                </Form.Item>
            </Card>

            <Card title="接触史" style={{ marginBottom: 24 }}>
                <Form.Item label="是否有确诊/疑似病例接触史?">
                     <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="接触时间">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="接触地点">
                            <Input placeholder="请输入接触地点" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="接触详情">
                    <Input.TextArea rows={3} placeholder="请详细描述接触史" />
                </Form.Item>
            </Card>

            <Card title="旅行史">
                <Form.Item label="近14天是否有外出旅行?">
                     <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="出发时间">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="返回时间">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                 <Form.Item label="目的地">
                    <Input placeholder="请输入目的地" />
                </Form.Item>
                <Form.Item label="旅行详情">
                    <Input.TextArea rows={3} placeholder="请详细描述旅行史" />
                </Form.Item>
            </Card>
        </Form>
    );
};

export default Step2Form;