import { useEffect, useState } from 'react';
import { Card, Col, Row, Space, List, Tag, Typography, Spin, Button } from 'antd';
import { getAlertEvents, type AlertData } from '../services/alertService';

// 添加日期时间格式化函数
const formatDateTime = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';
  
  try {
    // 尝试解析ISO格式的日期时间字符串
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      // 如果不是有效的日期格式，直接返回原字符串
      return dateTimeStr;
    }
    
    // 格式化为 YYYY-MM-DD HH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    // 如果解析出错，直接返回原字符串
    return dateTimeStr;
  }
};

const { Text } = Typography;

const AlertList = () => {
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<AlertData[]>([]);

    // 组件加载时获取数据
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { alerts } = await getAlertEvents();
            setAlerts(alerts); // 显示所有数据
        } catch (error) {
            console.error('获取预警数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        // 刷新数据
        await loadData();
    };

    const getStatusTag = (status: string) => {
        // 根据预警状态值设置不同颜色和文本
        let color = 'default';
        if (status === '预警中')  color = 'red';
        if (status === '已结束') color = 'gold';
        if (status === '添加') color = 'blue';
        if (status === '修改') color = 'success';
        if (status === '默认') color = 'default';
        return <Tag color={color}>{status}</Tag>;
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Row gutter={16}>
                    <Col span={24}>
                        <Typography.Title level={4}>预警列表</Typography.Title>
                        <Button type="primary" onClick={handleSearch}>查询</Button>
                    </Col>
                </Row>
            </Card>

            {loading ? (
                <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
            ) : (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                    dataSource={alerts}
                    renderItem={(item: AlertData) => (
                        <List.Item>
                            <Card
                                title={`标题: ${item.alertNo}`}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Row justify="space-between">
                                        <Text strong>预警类型名称: {item.type}</Text>
                                        {getStatusTag(item.status)}
                                    </Row>
                                    <Text type="secondary">预警时间: {formatDateTime(item.detectionTime)}</Text>
                                    <Text>来源: {item.location}</Text>
                                    <Text><strong>内容:</strong> {item.summary}</Text>
                                    <Text>预警ID: {item.id}</Text>
                                    <Row justify="space-between">
                                        <Text>添加或修改类型: {item.level}</Text>
                                        {getStatusTag(item.level)}
                                    </Row>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </Space>
    );
};

export default AlertList;