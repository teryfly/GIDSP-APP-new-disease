import { useState } from 'react';
import { Form, Button, Space, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import FollowUpForm from '../../components/forms/FollowUpForm';
import type { FollowUpFormData } from '../../types/forms';
import moment from 'moment';

const NewFollowUp = () => {
    const [form] = Form.useForm<FollowUpFormData>();
    const navigate = useNavigate();
    const { caseId, unknownCaseId } = useParams<{ caseId?: string; unknownCaseId?: string }>();

    const parentId = caseId || unknownCaseId;
    const parentType = caseId ? 'case' : 'unknownCase';

    if (!parentId) {
        message.error('缺少关联病例ID，无法新增随访记录。');
        navigate('/cases'); // Redirect to a safe page
        return null;
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('New Follow-Up Data:', values);
            message.success('随访记录创建成功!');
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
            <FollowUpForm form={form} parentType={parentType} parentId={parentId} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default NewFollowUp;