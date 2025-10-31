import { useState } from 'react';
import { Form, Button, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import PathogenForm from '../../components/forms/PathogenForm';
import type { PathogenFormData } from '../../types/forms';

const NewPathogen = () => {
    const [form] = Form.useForm<PathogenFormData>();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('New Pathogen Data:', values);
            message.success('病原体信息创建成功!');
            navigate('/pathogens'); // Navigate back to list
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate('/pathogens'); // Navigate back to list
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PathogenForm form={form} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default NewPathogen;