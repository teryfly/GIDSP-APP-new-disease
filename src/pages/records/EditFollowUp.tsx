import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import FollowUpForm from '../../components/forms/FollowUpForm';
import type { FollowUpFormData } from '../../types/forms';
import { followUps } from '../../data/followUps'; // Mock data
import moment from 'moment';

const EditFollowUp = () => {
    const [form] = Form.useForm<FollowUpFormData>();
    const navigate = useNavigate();
    const { caseId, unknownCaseId, id } = useParams<{ caseId?: string; unknownCaseId?: string; id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<FollowUpFormData | undefined>(undefined);

    const parentId = caseId || unknownCaseId;
    const parentType = caseId ? 'case' : 'unknownCase';

    useEffect(() => {
        if (id && parentId) {
            // Simulate fetching data
            const record = followUps.find(fu => fu.id === id && (fu.caseId === caseId || fu.caseId === unknownCaseId));
            if (record) {
                setInitialData({
                    ...record,
                    followUpDate: moment(record.date), // Use 'date' for followUpDate
                    nextFollowUpDate: record.nextFollowUpDate ? moment(record.nextFollowUpDate) : undefined,
                });
                form.setFieldsValue({
                    ...record,
                    followUpDate: moment(record.date),
                    nextFollowUpDate: record.nextFollowUpDate ? moment(record.nextFollowUpDate) : undefined,
                });
            } else {
                message.error('未找到该随访记录。');
                navigate(`/cases/${caseId || unknownCaseId}`);
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑随访记录。');
            navigate('/cases');
        }
    }, [id, caseId, unknownCaseId, navigate, form, parentId]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Follow-Up Data:', values);
            message.success('随访记录更新成功!');
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
            <FollowUpForm form={form} initialValues={initialData} parentType={parentType} parentId={parentId!} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditFollowUp;