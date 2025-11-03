import { Card, Space, Typography, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const EditRecordPage = () => {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();

    const getTitle = (recordType: string | undefined) => {
        switch (recordType) {
            case 'case': return '编辑个案';
            case 'follow-up': return '编辑随访记录';
            case 'treatment': return '编辑治疗记录';
            case 'test-record': return '编辑检测记录';
            case 'tracking-record': return '编辑追踪记录';
            default: return '编辑记录';
        }
    };

    const getReturnPath = (recordType: string | undefined, recordId: string | undefined) => {
        switch (recordType) {
            case 'case': return `/cases/${recordId}`;
            case 'follow-up':
            case 'treatment':
            case 'test-record':
            case 'tracking-record':
                // For sub-records, we need the parent case ID.
                // This generic page doesn't have it easily. For now, redirect to the main case list.
                // In a real app, the parent ID would be passed in the URL (e.g., /cases/:caseId/follow-ups/:id/edit)
                // and we would navigate back to /cases/:caseId
                return '/cases'; 
            default: return '/';
        }
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Title level={4}>{getTitle(type)}</Title>
                <Text>这是一个模拟的 {getTitle(type)} 页面。</Text>
                <p>您正在编辑 ID 为 <Text strong>{id}</Text> 的记录。</p>
                <Button type="primary" onClick={() => navigate(getReturnPath(type, id))}>返回详情/列表</Button>
            </Card>
        </Space>
    );
};

export default EditRecordPage;