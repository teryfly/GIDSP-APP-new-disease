import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import UnknownCaseForm from '../../components/forms/UnknownCaseForm';
import type { UnknownCaseFormData } from '../../types/forms';
import { unknownCases } from '../../data/unknownCases'; // Mock data
import moment from 'moment';

const EditUnknownCase = () => {
    const [form] = Form.useForm<UnknownCaseFormData>();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<UnknownCaseFormData | undefined>(undefined);

    useEffect(() => {
        if (id) {
            // Simulate fetching data
            const record = unknownCases.find(uc => uc.id === id);
            if (record) {
                setInitialData({
                    ...record,
                    address: '北京市朝阳区XX街道XX小区XX号楼XX单元', // Mock address for full form
                    reportOrgId: '北京市朝阳区疾控中心', // Mock
                    reportUserId: '李医生', // Mock
                    idCardNo: '110101197901011234', // Mock
                    phone: '13812345678', // Mock
                    clinicalSymptoms: record.symptoms, // Use symptoms for clinicalSymptoms
                    symptomOnsetDate: moment(record.reportDate).subtract(5, 'days'), // Mock symptom onset
                    reportDate: moment(record.reportDate),
                    urgencyLevel: record.urgency,
                    // Add other fields as needed for the form
                });
                form.setFieldsValue({
                    ...record,
                    address: '北京市朝阳区XX街道XX小区XX号楼XX单元',
                    reportOrgId: '北京市朝阳区疾控中心',
                    reportUserId: '李医生',
                    idCardNo: '110101197901011234',
                    phone: '13812345678',
                    clinicalSymptoms: record.symptoms,
                    symptomOnsetDate: moment(record.reportDate).subtract(5, 'days'),
                    reportDate: moment(record.reportDate),
                    urgencyLevel: record.urgency,
                });
            } else {
                message.error('未找到该不明原因病例。');
                navigate('/unknown-cases');
            }
            setLoading(false);
        } else {
            message.error('缺少必要的ID，无法编辑不明原因病例。');
            navigate('/unknown-cases');
        }
    }, [id, navigate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // In a real app, send values to API
            console.log('Updated Unknown Case Data:', values);
            message.success('不明原因病例更新成功!');
            navigate(`/unknown-cases/${id}`); // Navigate back to detail
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请检查表单填写项。');
        }
    };

    const handleCancel = () => {
        navigate(`/unknown-cases/${id}`); // Navigate back to detail
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <UnknownCaseForm form={form} initialValues={initialData} />
            <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Space>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditUnknownCase;