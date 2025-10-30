import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import TreatmentForm from '../../components/forms/TreatmentForm';
import type { TreatmentFormData } from '../../types/forms';
import { treatments } from '../../data/treatments'; // Mock data
import moment from 'moment';

const EditTreatment = () => {
    const [form] = Form.useForm<TreatmentFormData>();
    const navigate = useNavigate();
    const { caseId, id } = useParams<{ caseId: string; id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<TreatmentFormData | undefined>(undefined);

    useEffect(() => {
        if (id && caseId) {
            // Simulate fetching data
            const record = treatments.find(t => t.id === id && t.caseId === caseId);
            if (record) {
                setInitialData({
                    ...record,
                    treatmentDate: moment(record.date), // Use 'date' for treatmentDate
                    dischargeDate: record.dischargeDate ? moment(record.dischargeDate) : undefined,
                });
                form.setFieldsValue({
                    ...record,
                    treatmentDate: moment(record.date),
                    dischargeDate: record.dischargeDate ? moment(record.dischargeDate) : undefined,
                });
            } else {
                message.error('未找到该治疗记录。');
                navigate(`/cases/${caseId}`);
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑治疗记录。');
            navigate('/cases');
        }
    }, [id, caseId, navigate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Treatment Data:', values);
            message.success('治疗记录更新成功!');
            navigate(`/cases/${caseId}`); // Navigate back to case detail
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate(`/cases/${caseId}`); // Navigate back to case detail
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <TreatmentForm form={form} initialValues={initialData} caseId={caseId!} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditTreatment;