import { useState } from 'react';
import { Form, Button, Space, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import TrackingRecordForm from '../../components/forms/TrackingRecordForm';
import type { TrackingRecordFormData } from '../../types/forms';

const NewTrackingRecord = () => {
    const [form] = Form.useForm<TrackingRecordFormData>();
    const navigate = useNavigate();
    const { caseId } = useParams<{ caseId: string }>();

    if (!caseId) {
        message.error('缺少关联个案ID，无法新增追踪记录。');
        navigate('/cases'); // Redirect to a safe page
        return null;
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('New Tracking Record Data:', values);
            message.success('追踪记录创建成功!');
            navigate(`/cases/${caseId}`); // Navigate back to case detail
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate(`/cases/${caseId}`); // Navigate back to case detail
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <TrackingRecordForm form={form} caseId={caseId} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default NewTrackingRecord;