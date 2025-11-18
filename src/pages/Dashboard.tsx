import { ArrowUpOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, List, Space, Typography, Button, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProcessingCasesCount, getVerifiedCasesCount, getNewCasesCount, getAlertEventsCount, getVerifiedCasesTodo, getPendingConfirmationTestsTodo, getTrackedEntityDetails, getPendingAlertsTodo } from '../services/dashboardService';
import { recentVisits, quickAccess } from '../data/dashboard';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [processingCases, setProcessingCases] = useState(0);
    const [verifiedCases, setVerifiedCases] = useState(0);
    const [newCases, setNewCases] = useState({ count: 0, trend: 0 });
    const [alertEvents, setAlertEvents] = useState(0);
    const [verifiedCasesTodo, setVerifiedCasesTodo] = useState<any[]>([]); // 已核实个案待办数据
    const [pendingTestsTodo, setPendingTestsTodo] = useState<any[]>([]); // 待确认检测待办数据
    const [pendingAlertsTodo, setPendingAlertsTodo] = useState<any[]>([]); // 待处理预警待办数据
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    processingCount, 
                    verifiedCount, 
                    newCasesData, 
                    alertEventsCount,
                    verifiedCasesData,
                    pendingTestsData,
                    pendingAlertsData
                ] = await Promise.all([
                    getProcessingCasesCount(),
                    getVerifiedCasesCount(),
                    getNewCasesCount(),
                    getAlertEventsCount(),
                    getVerifiedCasesTodo(),
                    getPendingConfirmationTestsTodo(),
                    getPendingAlertsTodo()
                ]);
                
                setProcessingCases(processingCount);
                setVerifiedCases(verifiedCount);
                setNewCases(newCasesData);
                setAlertEvents(alertEventsCount);
                
                // 获取已核实个案的详细信息
                const verifiedCasesWithDetails = await Promise.all(
                    verifiedCasesData.map(async (item: any) => {
                        const details = await getTrackedEntityDetails(item.trackedEntity);
                        return {
                            ...item,
                            details
                        };
                    })
                );
                
                // 获取待确认检测的详细信息
                const pendingTestsWithDetails = await Promise.all(
                    pendingTestsData.map(async (item: any) => {
                        const details = await getTrackedEntityDetails(item.trackedEntity);
                        return {
                            ...item,
                            details
                        };
                    })
                );
                
                // 获取待处理预警的详细信息
                const pendingAlertsWithDetails = await Promise.all(
                    pendingAlertsData.map(async (item: any) => {
                        // 对于预警数据，我们直接使用事件数据中的信息
                        return {
                            ...item
                        };
                    })
                );
                
                setVerifiedCasesTodo(verifiedCasesWithDetails);
                setPendingTestsTodo(pendingTestsWithDetails);
                setPendingAlertsTodo(pendingAlertsWithDetails);
            } catch (error) {
                console.error('获取仪表盘数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 解析预警数据中的字段
    const parseAlertData = (dataValues: any[]) => {
        const dataMap: Record<string, string> = {};
        dataValues.forEach(item => {
            dataMap[item.dataElement] = item.value;
        });
        
        return {
            alertId: dataMap['a4N9z9gZaJc'] || '', // 预警ID
            title: dataMap['rG1gIAVrgKK'] || '', // 标题
            type: dataMap['liKIghiuKTt'] || '', // 预警类型名称
            content: dataMap['pjYdGWLER7d'] || '', // 内容
            source: dataMap['m9Pa8zeSCNG'] || '', // 来源
            time: dataMap['O5kMFPyrkmj'] || '', // 预警时间
            eventId: dataMap['QOk13DNk20K'] || '', // 事件ID
            modifyType: dataMap['wOlEjbF6Ija'] || '', // 添加或修改类型
            status: dataMap['YAhyASn12MH'] || '' // 预警状态
        };
    };

    const metrics = [
        { title: '本月新增个案', value: newCases.count, trend: newCases.trend, unit: '%' },
        { title: '已核实个案', value: verifiedCases, link: '/cases?status=已核实' },
        { title: '处理中个案', value: processingCases, link: '/cases?status=处理中' },
        { title: '本月预警事件', value: alertEvents, link: '/alerts' },
    ];

    // 构造待办事项数据
    const todoItems = [
        {
            id: 'todo-1',
            category: '已核实个案',
            count: verifiedCasesTodo.length,
            items: verifiedCasesTodo.map((event: any) => ({
                trackedEntity: event.trackedEntity,
                type: 'case',
                details: event.details
            }))
        },
        {
            id: 'todo-2',
            category: '待确认检测',
            count: pendingTestsTodo.length,
            items: pendingTestsTodo.map((event: any) => ({
                trackedEntity: event.trackedEntity,
                type: 'unknown-case',
                details: event.details
            }))
        },
        {
            id: 'todo-3',
            category: '待处理预警',
            count: pendingAlertsTodo.length,
            items: pendingAlertsTodo.map((event: any) => ({
                event: event.event,
                type: 'alert',
                dataValues: event.dataValues
            }))
        }
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
                                dataSource={item.items}
                                renderItem={(subItem: any) => {
                                    // 提取显示信息
                                    let displayText = subItem.trackedEntity;
                                    if (subItem.type === 'case' && subItem.details && subItem.details.enrollments && subItem.details.enrollments.length > 0) {
                                        const attributes = subItem.details.enrollments[0].attributes || [];
                                        const attrMap = new Map(attributes.map((attr: any) => [attr.attribute, attr.value]));
                                        
                                        if (subItem.type === 'case') {
                                            // 已核实个案显示格式: 个案编号|姓名|年龄|报告日期
                                            const caseNo = attrMap.get('AtrCaseNo01') || '';
                                            const name = attrMap.get('AtrFullNm01') || '';
                                            const age = attrMap.get('AtrAge00001') || '';
                                            const reportDate = attrMap.get('AtrRptDt001') || '';
                                            displayText = `${caseNo} | ${name} | ${age} | ${reportDate}`;
                                        } else {
                                            // 待确认检测显示格式: 不明病例编号|姓名|年龄|报告日期
                                            const unkNo = attrMap.get('AtrUnkNo001') || '';
                                            const name = attrMap.get('AtrFullNm01') || '';
                                            const age = attrMap.get('AtrAge00001') || '';
                                            const reportDate = attrMap.get('AtrRptDt001') || '';
                                            displayText = `${unkNo} | ${name} | ${age} | ${reportDate}`;
                                        }
                                    } else if (subItem.type === 'alert' && subItem.dataValues) {
                                        // 待处理预警显示格式: 标题|预警类型名称|内容|预警时间
                                        const alertData = parseAlertData(subItem.dataValues);
                                        // 格式化时间显示
                                        const formattedTime = alertData.time ? alertData.time.split('T')[0] : '';
                                        displayText = `${alertData.title} | ${alertData.type} | ${alertData.content} | ${formattedTime}`;
                                    }
                                    
                                    return (
                                        <List.Item>
                                            {subItem.type === 'case' ? (
                                                <Link to={`/cases/${subItem.trackedEntity}`}>{displayText}</Link>
                                            ) : subItem.type === 'unknown-case' ? (
                                                <Link to={`/unknown-cases/${subItem.trackedEntity}?from=pending-test`}>{displayText}</Link>
                                            ) : (
                                                <Link to={`/alerts`}>{displayText}</Link>
                                            )}
                                        </List.Item>
                                    );
                                }}
                                style={{ maxHeight: '300px', overflowY: 'auto' }}
                            />

                            <style>
                                {`
                                    /* 自定义滚动条样式 - 针对所有可能的列表容器 */
                                    [class*="ant-list"] .ant-list-items::-webkit-scrollbar,
                                    .ant-list-item .ant-list-items::-webkit-scrollbar {
                                        width: 4px;
                                    }
                                    
                                    [class*="ant-list"] .ant-list-items::-webkit-scrollbar-track,
                                    .ant-list-item .ant-list-items::-webkit-scrollbar-track {
                                        background: rgba(0, 0, 0, 0.02);
                                        border-radius: 2px;
                                    }
                                    
                                    [class*="ant-list"] .ant-list-items::-webkit-scrollbar-thumb,
                                    .ant-list-item .ant-list-items::-webkit-scrollbar-thumb {
                                        background: rgba(0, 0, 0, 0.15);
                                        border-radius: 2px;
                                        transition: background 0.3s ease;
                                    }
                                    
                                    [class*="ant-list"] .ant-list-items::-webkit-scrollbar-thumb:hover,
                                    .ant-list-item .ant-list-items::-webkit-scrollbar-thumb:hover {
                                        background: rgba(0, 0, 0, 0.25);
                                    }
                                    
                                    /* Firefox滚动条样式 */
                                    [class*="ant-list"] .ant-list-items,
                                    .ant-list-item .ant-list-items {
                                        scrollbar-width: thin;
                                        scrollbar-color: rgba(0, 0, 0, 0.15) rgba(0, 0, 0, 0.02);
                                    }
                                `}
                            </style>
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