import { Card, Space, Typography, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const NewRecordPage = () => {
    const { type } = useParams<{ type: string }>();
    const navigate = useNavigate();

    const getTitle = (recordType: string | undefined) => {
        switch (recordType) {
            case 'case': return '新增个案';
            case 'follow-up': return '新增随访记录';
            case 'treatment': return '新增治疗记录';
            case 'test-record': return '新增检测记录';
            case 'tracking-record': return '新增追踪记录';
            default: return '新增记录';
        }
    };

    const getReturnPath = (recordType: string | undefined) => {
        switch (recordType) {
            case 'case':
                return `/${recordType}s`;
            case 'follow-up':
            case 'treatment':
            case 'test-record':
            case 'tracking-record':
                // For sub-records, we need to know the parent case ID.
                // This generic page doesn't have it, so we'll just go to cases list for now.
                // In a real app, the parent ID would be passed or derived.
                return '/cases'; 
            default: return '/';
        }
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Title level={4}>{getTitle(type)}</Title>
                <Text>这是一个模拟的 {getTitle(type)} 页面。</Text>
                <p>在这里可以填写表单来创建新的 {getTitle(type).replace('新增', '')}。</p>
                <Button type="primary" onClick={() => navigate(getReturnPath(type))}>返回列表</Button>
            </Card>
        </Space>
    );
};

export default NewRecordPage;