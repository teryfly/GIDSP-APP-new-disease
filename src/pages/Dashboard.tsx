import { ArrowUpOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, List, Space, Typography, Button, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { metrics, todoItems, recentVisits, quickAccess } from '../data/dashboard';

const { Title, Text } = Typography;

const Dashboard = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                {metrics.map((metric, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card>
                            <Statistic
                                title={metric.title}
                                value={metric.value}
                                precision={0}
                                valueStyle={metric.trend ? { color: '#3f8600' } : {}}
                                prefix={metric.trend ? <ArrowUpOutlined /> : null}
                                suffix={metric.unit}
                            />
                            {metric.link && <Link to={metric.link} style={{ marginTop: '10px', display: 'block' }}>查看</Link>}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card title="待办事项">
                <List
                    itemLayout="vertical"
                    dataSource={todoItems}
                    renderItem={item => (
                        <List.Item key={item.id}>
                            <List.Item.Meta
                                title={`${item.category} (${item.count})`}
                            />
                            <List
                                size="small"
                                dataSource={item.items.slice(0, 3)}
                                renderItem={subItem => <List.Item>{subItem}</List.Item>}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card>
                        <Title level={5}>最近访问</Title>
                        <List
                            dataSource={recentVisits}
                            renderItem={item => (
                                <List.Item>
                                    <Link to={item.link}>{item.name}</Link>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card>
                        <Title level={5}>快捷入口</Title>
                        <Space wrap>
                            {quickAccess.map(item => (
                                <Button key={item.id} type="primary" ghost>
                                    <Link to={item.link}>{item.name}</Link>
                                </Button>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </Space>
    );
};

export default Dashboard;