import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PathogenForm from '../../components/forms/PathogenForm';
import type { PathogenFormData } from '../../types/forms';
import { pathogens } from '../../data/pathogens'; // Mock data

const EditPathogen = () => {
    const [form] = Form.useForm<PathogenFormData>();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<PathogenFormData | undefined>(undefined);

    useEffect(() => {
        if (id) {
            // Simulate fetching data
            const record = pathogens.find(p => p.id === id);
            if (record) {
                setInitialData({ ...record, pathogenName: record.name, pathogenType: record.type, biosafettyLevel: record.bsl });
                form.setFieldsValue({ ...record, pathogenName: record.name, pathogenType: record.type, biosafettyLevel: record.bsl });
            } else {
                message.error('未找到该病原体信息。');
                navigate('/pathogens');
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑病原体信息。');
            navigate('/pathogens');
        }
    }, [id, navigate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Pathogen Data:', values);
            message.success('病原体信息更新成功!');
            navigate('/pathogens'); // Navigate back to list
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate('/pathogens'); // Navigate back to list
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PathogenForm form={form} initialValues={initialData} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditPathogen;