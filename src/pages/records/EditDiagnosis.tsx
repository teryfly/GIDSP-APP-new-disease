import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, Input, Select, DatePicker } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
    getCaseDetails, 
    updateEvents, 
    updateEnrollments,
    PROGRAM_STAGE_INVESTIGATION_ID, 
    PROGRAM_ID 
} from '../../services/caseDetailsService';
import { loadOptionSetCached } from '../../services/newCaseService';

const { Title } = Typography;

const EditDiagnosis = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [eventUid, setEventUid] = useState<string>('');
    const [enrollment, setEnrollment] = useState<string>('');
    const [orgUnit, setOrgUnit] = useState<string>('');
    const [occurredAt, setOccurredAt] = useState<string>('');
    const [caseSrcOpts, setCaseSrcOpts] = useState<{ value: string; label: string }[]>([]);
    const [caseStatOpts, setCaseStatOpts] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        if (!id) {
            message.error('缺少个案ID');
            navigate('/cases');
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const [src, stat] = await Promise.all([
                    loadOptionSetCached('OsCaseSrc01'),
                    loadOptionSetCached('OsCaseStat1'),
                ]);
                setCaseSrcOpts((src.options || []).map(o => ({ value: o.code, label: o.name })));
                setCaseStatOpts((stat.options || []).map(o => ({ value: o.code, label: o.name })));

                const tei = await getCaseDetails(id);
                const enr = tei.enrollments?.[0];
                if (!enr) {
                    message.error('该个案没有入组记录');
                    navigate(`/cases/${id}`);
                    return;
                }

                const investigationEvent = enr.events?.find(e => e.programStage === PROGRAM_STAGE_INVESTIGATION_ID);
                if (!investigationEvent) {
                    message.error('未找到调查事件');
                    navigate(`/cases/${id}`);
                    return;
                }

                setEventUid(investigationEvent.event);
                setEnrollment(enr.enrollment);
                setOrgUnit(investigationEvent.orgUnit);
                setOccurredAt(investigationEvent.occurredAt);

                const enrAttrMap = new Map((enr.attributes || []).map(a => [a.attribute, a.value]));
                const diagnosisDate = enrAttrMap.get('AtrDiagDt01');
                const caseSourceCode = enrAttrMap.get('AtrCaseSrc1');

                const dvMap = new Map(investigationEvent.dataValues.map(dv => [dv.dataElement, dv.value]));
                const caseStatusCode = dvMap.get('DeCaseStat1');

                form.setFieldsValue({
                    initialDiagnosis: '初步诊断数据（暂无直接字段）',
                    finalDiagnosis: '确诊诊断数据（暂无直接字段）',
                    diagnosisDate: diagnosisDate ? dayjs(diagnosisDate) : undefined,
                    caseSourceCode,
                    caseStatusCode,
                });
            } catch (e: any) {
                message.error(`加载失败: ${e.message}`);
                navigate(`/cases/${id}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate, form]);

    const handleSubmit = async () => {
        if (!eventUid || !enrollment || !orgUnit) {
            message.error('缺少必要的上下文信息');
            return;
        }

        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const enrollmentAttrs = [];
            if (values.diagnosisDate) {
                enrollmentAttrs.push({ attribute: 'AtrDiagDt01', value: values.diagnosisDate.format('YYYY-MM-DD') });
            }
            if (values.caseSourceCode) {
                enrollmentAttrs.push({ attribute: 'AtrCaseSrc1', value: values.caseSourceCode });
            }

            if (enrollmentAttrs.length > 0) {
                await updateEnrollments([{
                    enrollment,
                    program: PROGRAM_ID,
                    orgUnit,
                    attributes: enrollmentAttrs,
                }]);
            }

            const dataValues = [];
            if (values.caseStatusCode) {
                dataValues.push({ dataElement: 'DeCaseStat1', value: values.caseStatusCode });
            }

            if (dataValues.length > 0) {
                await updateEvents([{
                    event: eventUid,
                    program: PROGRAM_ID,
                    programStage: PROGRAM_STAGE_INVESTIGATION_ID,
                    enrollment,
                    orgUnit,
                    status: 'ACTIVE',
                    occurredAt,
                    dataValues,
                }]);
            }

            message.success('诊断信息更新成功!');
            navigate(`/cases/${id}`);
        } catch (errorInfo: any) {
            console.log('Failed:', errorInfo);
            message.error(errorInfo.message || '请检查表单填写项。');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/cases/${id}`);
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Title level={4}>编辑诊断信息</Title>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="初步诊断"
                        name="initialDiagnosis"
                        rules={[
                            { required: true, message: '请输入初步诊断' },
                            { min: 2, max: 500, message: '初步诊断2-500个字符' }
                        ]}
                    >
                        <Input.TextArea rows={2} placeholder="请输入初步诊断信息" showCount maxLength={500} />
                    </Form.Item>
                    <Form.Item
                        label="确诊诊断"
                        name="finalDiagnosis"
                        rules={[{ min: 2, max: 500, message: '确诊诊断2-500个字符' }]}
                    >
                        <Input.TextArea rows={2} placeholder="请输入确诊诊断信息（可选）" showCount maxLength={500} />
                    </Form.Item>
                    <Form.Item
                        label="诊断日期"
                        name="diagnosisDate"
                        rules={[{ required: true, message: '请选择诊断日期' }]}
                        tooltip="诊断日期通常在症状开始日期之后，不能晚于今天"
                    >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > dayjs().endOf('day')} placeholder="选择诊断日期" />
                    </Form.Item>
                    <Form.Item label="个案来源" name="caseSourceCode" rules={[{ required: true, message: '请选择个案来源' }]}>
                        <Select placeholder="请选择来源" options={caseSrcOpts} />
                    </Form.Item>
                    <Form.Item label="个案状态" name="caseStatusCode" tooltip="可选，更新调查事件的个案状态字段">
                        <Select placeholder="请选择个案状态（可选）" options={caseStatOpts} allowClear />
                    </Form.Item>
                </Form>
            </Card>

            <div style={{ textAlign: 'right' }}>
                <Space>
                    <Button onClick={handleCancel} disabled={submitting}>取消</Button>
                    <Button type="primary" onClick={handleSubmit} loading={submitting}>保存</Button>
                </Space>
            </div>
        </Space>
    );
};

export default EditDiagnosis;