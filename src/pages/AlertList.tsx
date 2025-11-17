import { Card, Col, DatePicker, Form, Input, Row, Select, Space, Button, List, Tag, Typography } from 'antd';
import { type Alert, alerts } from '../data/alerts';
import { Link } from 'react-router-dom'; // Import Link

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AlertList = () => {

    const getLevelTag = (level: string) => {
        let color = 'default';
        if (level === '一级') color = 'red';
        if (level === '二级') color = 'orange';
        if (level === '三级') color = 'gold';
        if (level === '四级') color = 'blue';
        return <Tag color={color}>{level}</Tag>;
    };

    const getStatusTag = (status: string) => {
        let color = 'default';
        if (status === '待处理') color = 'gold';
        if (status === '处理中') color = 'blue';
        if (status === '已核实') color = 'success';
        if (status === '误报') color = 'default';
        return <Tag color={color}>{status}</Tag>;
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item label="预警编号">
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="预警类型">
                                <Select placeholder="请选择" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="预警等级">
                                <Select placeholder="请选择" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="预警状态">
                                <Select placeholder="请选择" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Space>
                                <Button type="primary">查询</Button>
                                <Button>重置</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                dataSource={alerts}
                renderItem={(item: Alert) => (
                    <List.Item>
                        <Card
                            title={item.alertNo}
                            extra={
                                <Button type="primary" ghost={item.status !== '待处理'} size="small">
                                    <Link to={`/alerts/${item.id}/detail`}> {/* Updated link */}
                                        {item.status === '待处理' ? '处理' : '查看'}
                                    </Link>
                                </Button>
                            }
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Row justify="space-between">
                                    <Text strong>{item.type}</Text>
                                    {getLevelTag(item.level)}
                                </Row>
                                <Text type="secondary">{item.detectionTime}</Text>
                                <Text>{item.location}</Text>
                                <Text><strong>摘要:</strong> {item.summary}</Text>
                                {/* <Row justify="space-between">
                                    <Text type="secondary">关联病例: {item.relatedCases}例</Text>
                                    {getStatusTag(item.status)}
                                </Row> */}
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />
        </Space>
    );
};

export default AlertList;