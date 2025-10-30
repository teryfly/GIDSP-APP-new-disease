import { useState } from 'react';
import { Form, Button, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import UnknownCaseForm from '../../components/forms/UnknownCaseForm';
import type { UnknownCaseFormData } from '../../types/forms';
import moment from 'moment';

const NewUnknownCase = () => {
    const [form] = Form.useForm<UnknownCaseFormData>();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('New Unknown Case Data:', values);
            message.success('不明原因病例创建成功!');
            navigate('/unknown-cases'); // Navigate back to list
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate('/unknown-cases'); // Navigate back to list
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <UnknownCaseForm form={form} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default NewUnknownCase;