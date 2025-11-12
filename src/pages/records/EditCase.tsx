import { useState, useEffect } from 'react';
import { Steps, Button, Card, Space, message, Row, Col, Typography, Form, Spin } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Import useLocation
import Step1Form from '../../components/NewCase/Step1Form';
import Step2Form from '../../components/NewCase/Step2Form';
import Step3Form from '../../components/NewCase/Step3Form';
import Step4Confirm from '../../components/NewCase/Step4Confirm';
import moment from 'moment';
import type { CaseFormData } from '../../types/forms';
import { cases } from '../../data/cases'; // Mock data

const { Step } = Steps;
const { Title } = Typography;

const steps = [
    { title: '基本信息', content: (form: any) => <Step1Form form={form} /> },
    { title: '流行病学', content: (form: any) => <Step2Form form={form} /> },
    { title: '诊断信息', content: (form: any) => <Step3Form form={form} /> },
    { title: '确认提交', content: (form: any) => <Step4Confirm form={form} /> },
];

const EditCase = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation(); // Get location object to read query params
    const navigate = useNavigate();
    const [form] = Form.useForm<CaseFormData>();
    const [loading, setLoading] = useState(true);

    // Initialize current step based on URL query parameter, default to 0
    const initialStep = new URLSearchParams(location.search).get('step');
    const [current, setCurrent] = useState(initialStep ? parseInt(initialStep, 10) : 0);

    useEffect(() => {
        if (id) {
            const caseData = cases.find(c => c.id === id);
            if (caseData) {
                // Mocking epidemiological and diagnostic data based on the limited Case interface
                const initialValues: CaseFormData = {
                    ...caseData,
                    gender: caseData.gender === '男' ? 'male' : 'female',
                    reportDate: moment(caseData.reportDate),
                    symptomOnsetDate: moment(caseData.symptomOnsetDate),
                    diagnosisDate: moment(caseData.diagnosisDate),
                    dob: moment(caseData.reportDate).subtract(caseData.age, 'years'), // Mock DOB
                    diseaseId: '3', // Mock diseaseId for新冠肺炎
                    hasExposure: true, // Mock
                    exposureHistory: '曾到疫区出差', // Mock
                    hasContact: false, // Mock
                    hasTravel: true, // Mock
                    travelStartDate: moment('2024-01-01'), // Mock
                    travelEndDate: moment('2024-01-05'), // Mock
                    travelDestination: '外省某市', // Mock
                    travelHistory: '乘坐高铁往返', // Mock
                    initialDiagnosis: caseData.diagnosis,
                    caseSource: 'active', // Mock
                    symptoms: ['fever', 'cough'], // Mock
                };
                form.setFieldsValue(initialValues);
            } else {
                message.error('未找到该个案信息。');
                navigate('/cases');
            }
            setLoading(false);
        } else {
            message.error('缺少个案ID，无法编辑。');
            navigate('/cases');
        }
    }, [id, navigate, form]); // Removed `current` from dependencies to prevent re-rendering loop

    const next = async () => {
        try {
            await form.validateFields();
            setCurrent(current + 1);
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请填写完整当前步骤的必填项！');
        }
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            const values = form.getFieldsValue(true);
            const formattedValues = {
                ...values,
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : undefined,
                symptomOnsetDate: values.symptomOnsetDate ? values.symptomOnsetDate.format('YYYY-MM-DD') : undefined,
                dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
                contactDate: values.contactDate ? values.contactDate.format('YYYY-MM-DD') : undefined,
                travelStartDate: values.travelStartDate ? values.travelStartDate.format('YYYY-MM-DD') : undefined,
                travelEndDate: values.travelEndDate ? values.travelEndDate.format('YYYY-MM-DD') : undefined,
                diagnosisDate: values.diagnosisDate ? values.diagnosisDate.format('YYYY-MM-DD') : undefined,
            };
            console.log('Form updated:', formattedValues);
            message.success('个案更新成功!');
            navigate(`/cases/${id}`);
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('提交失败，请检查所有必填项！');
        }
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>编辑个案调查表 - {id}</Title>
                </Col>
                <Col>
                    <Space>
                        <Button key="2">保存草稿</Button>
                        <Button key="1" onClick={() => navigate(`/cases/${id}`)}>取消</Button>
                    </Space>
                </Col>
            </Row>
            <Card>
                <Steps current={current}>
                    {steps.map(item => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>
                <div style={{ marginTop: 24, minHeight: 400 }}>
                    <Form form={form} layout="vertical">
                        {steps[current].content(form)}
                    </Form>
                </div>
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Space>
                        {current > 0 && (
                            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                                上一步
                            </Button>
                        )}
                        {current < steps.length - 1 && (
                            <Button type="primary" onClick={() => next()}>
                                下一步
                            </Button>
                        )}
                        {current === steps.length - 1 && (
                            <Button type="primary" onClick={handleSubmit}>
                                提交更新
                            </Button>
                        )}
                    </Space>
                </div>
            </Card>
        </Space>
    );
};

export default EditCase;