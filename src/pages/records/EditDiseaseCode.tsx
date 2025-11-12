import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import DiseaseCodeForm from '../../components/forms/DiseaseCodeForm';
import type { DiseaseCodeFormData } from '../../types/forms';
import { diseaseCodes } from '../../data/diseaseCodes'; // Mock data

const EditDiseaseCode = () => {
    const [form] = Form.useForm<DiseaseCodeFormData>();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<DiseaseCodeFormData | undefined>(undefined);

    useEffect(() => {
        if (id) {
            // Simulate fetching data
            const record = diseaseCodes.find(dc => dc.id === id);
            if (record) {
                setInitialData({
                    ...record,
                    // Mock relatedPathogens if needed, based on existing data
                    relatedPathogens: ['p1', 'p2'], // Example mock
                });
                form.setFieldsValue({
                    ...record,
                    relatedPathogens: ['p1', 'p2'],
                });
            } else {
                message.error('未找到该疾病编码。');
                navigate('/disease-codes');
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑疾病编码。');
            navigate('/disease-codes');
        }
    }, [id, navigate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Disease Code Data:', values);
            message.success('疾病编码更新成功!');
            navigate('/disease-codes'); // Navigate back to list
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate('/disease-codes'); // Navigate back to list
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DiseaseCodeForm form={form} initialValues={initialData} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditDiseaseCode;