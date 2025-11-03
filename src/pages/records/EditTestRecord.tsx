import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import TestRecordForm from '../../components/forms/TestRecordForm';
import type { TestRecordFormData } from '../../types/forms';
import { testRecords } from '../../data/testRecords'; // Mock data
import moment from 'moment';

const EditTestRecord = () => {
    const [form] = Form.useForm<TestRecordFormData>();
    const navigate = useNavigate();
    const { caseId, id } = useParams<{ caseId?: string; id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<TestRecordFormData | undefined>(undefined);

    const parentId = caseId;
    const parentType = 'case';

    useEffect(() => {
        if (id && parentId) {
            // Simulate fetching data
            const record = testRecords.find(tr => tr.id === id && tr.caseId === caseId);
            if (record) {
                const initialFormData: TestRecordFormData = {
                    caseId: record.caseId,
                    sampleCollectionDate: moment(record.collectionTime),
                    sampleType: record.sampleType,
                    testType: record.testType,
                    testOrgName: record.lab,
                    testResult: record.result,
                    pathogenDetected: record.pathogen,
                    testStatus: record.testStatus,
                    testDate: record.testStatus === '已确认' ? moment(record.collectionTime) : undefined, // Mock testDate if confirmed
                };
                setInitialData(initialFormData);
                form.setFieldsValue(initialFormData);
            } else {
                message.error('未找到该检测记录。');
                navigate(caseId ? `/cases/${caseId}` : '/cases');
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑检测记录。');
            navigate('/cases');
        }
    }, [id, caseId, navigate, form, parentId]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Test Record Data:', values);
            message.success('检测记录更新成功!');
            navigate(caseId ? `/cases/${caseId}` : '/cases'); // Navigate back to parent detail
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate(caseId ? `/cases/${caseId}` : '/cases'); // Navigate back to parent detail
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <TestRecordForm form={form} initialValues={initialData} parentType={parentType} parentId={parentId!} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditTestRecord;