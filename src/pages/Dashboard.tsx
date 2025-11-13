import { ArrowUpOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, List, Space, Typography, Button, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProcessingCasesCount, getVerifiedCasesCount, getNewCasesCount } from '../services/dashboardService';
import { todoItems, recentVisits, quickAccess } from '../data/dashboard';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [processingCases, setProcessingCases] = useState(0);
    const [verifiedCases, setVerifiedCases] = useState(0);
    const [newCases, setNewCases] = useState({ count: 0, trend: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [processingCount, verifiedCount, newCasesData] = await Promise.all([
                    getProcessingCasesCount(),
                    getVerifiedCasesCount(),
                    getNewCasesCount()
                ]);
                
                setProcessingCases(processingCount);
                setVerifiedCases(verifiedCount);
                setNewCases(newCasesData);
            } catch (error) {
                console.error('获取仪表盘数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const metrics = [
        { title: '本月新增个案', value: newCases.count, trend: newCases.trend, unit: '%' },
        { title: '已核实个案', value: verifiedCases, link: '/cases?status=已核实' },
        { title: '处理中个案', value: processingCases, link: '/cases?status=处理中' },
        { title: '本月预警事件', value: 2, link: '/alerts?status=待处理' },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                {metrics.map((metric, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card loading={loading && index < 3}>
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
                {/* <Col xs={24} md={12}>
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
                </Col> */}
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