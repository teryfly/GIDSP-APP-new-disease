import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import TrackingRecordForm from '../../components/forms/TrackingRecordForm';
import type { TrackingRecordFormData } from '../../types/forms';
import { trackingRecords } from '../../data/trackingRecords'; // Mock data
import moment from 'moment';

const EditTrackingRecord = () => {
    const [form] = Form.useForm<TrackingRecordFormData>();
    const navigate = useNavigate();
    const { caseId, id } = useParams<{ caseId: string; id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<TrackingRecordFormData | undefined>(undefined);

    useEffect(() => {
        if (id && caseId) {
            // Simulate fetching data
            const record = trackingRecords.find(tr => tr.id === id && tr.caseId === caseId);
            if (record) {
                setInitialData({
                    ...record,
                    trackingDate: moment(record.date), // Use 'date' for trackingDate
                    startDate: moment(record.startDate),
                    endDate: moment(record.endDate),
                    regionId: 'region1', // Mock regionId, actual data doesn't have it
                    exposureDetails: record.description, // Use description for exposureDetails
                });
                form.setFieldsValue({
                    ...record,
                    trackingDate: moment(record.date),
                    startDate: moment(record.startDate),
                    endDate: moment(record.endDate),
                    regionId: 'region1',
                    exposureDetails: record.description,
                });
            } else {
                message.error('未找到该追踪记录。');
                navigate(`/cases/${caseId}`);
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑追踪记录。');
            navigate('/cases');
        }
    }, [id, caseId, navigate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Tracking Record Data:', values);
            message.success('追踪记录更新成功!');
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
            <TrackingRecordForm form={form} initialValues={initialData} caseId={caseId!} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditTrackingRecord;