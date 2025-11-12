import { useState } from 'react';
import { Form, Button, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import DiseaseCodeForm from '../../components/forms/DiseaseCodeForm';
import type { DiseaseCodeFormData } from '../../types/forms';

const NewDiseaseCode = () => {
    const [form] = Form.useForm<DiseaseCodeFormData>();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('New Disease Code Data:', values);
            message.success('疾病编码创建成功!');
            navigate('/disease-codes'); // Navigate back to list
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate('/disease-codes'); // Navigate back to list
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DiseaseCodeForm form={form} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default NewDiseaseCode;