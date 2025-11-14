import { Card, Space, Typography, Button, Descriptions, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { alerts } from '../data/alerts';

const { Title, Text } = Typography;

const AlertDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const alertData = alerts.find(a => a.id === id);

    if (!alertData) {
        return (
            <Card>
                <Title level={4}>预警详情</Title>
                <Text>未找到该预警信息。</Text>
                <Button type="primary" onClick={() => navigate('/alerts')}>返回预警列表</Button>
            </Card>
        );
    }

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
                <Descriptions title={`预警编号: ${alertData.alertNo}`} bordered column={2}
                    extra={
                        <Space>
                            <Button type="primary">处理预警</Button>
                            <Button onClick={() => navigate('/alerts')}>返回列表</Button>
                        </Space>
                    }
                >
                    <Descriptions.Item label="预警类型">{alertData.type}</Descriptions.Item>
                    <Descriptions.Item label="预警级别">{getLevelTag(alertData.level)}</Descriptions.Item>
                    <Descriptions.Item label="状态">{getStatusTag(alertData.status)}</Descriptions.Item>
                    <Descriptions.Item label="检测时间">{alertData.detectionTime}</Descriptions.Item>
                    <Descriptions.Item label="位置">{alertData.location}</Descriptions.Item>
                    {/* <Descriptions.Item label="关联病例">{alertData.relatedCases} 例</Descriptions.Item> */}
                    <Descriptions.Item label="触发规则" span={2}>{alertData.triggerRule}</Descriptions.Item>
                    <Descriptions.Item label="摘要" span={2}>{alertData.summary}</Descriptions.Item>
                </Descriptions>
            </Card>
        </Space>
    );
};

export default AlertDetail;