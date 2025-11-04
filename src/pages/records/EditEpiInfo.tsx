import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, Row, Col, Input, Radio, DatePicker } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCaseDetails, updateEvents, PROGRAM_STAGE_INVESTIGATION_ID, PROGRAM_ID } from '../../services/caseDetailsService';

const { Title } = Typography;

const EditEpiInfo = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [eventUid, setEventUid] = useState<string>('');
    const [enrollment, setEnrollment] = useState<string>('');
    const [orgUnit, setOrgUnit] = useState<string>('');
    const [occurredAt, setOccurredAt] = useState<string>('');

    const hasContact = Form.useWatch('hasContact', form);
    const hasTravel = Form.useWatch('hasTravel', form);
    const hasExposure = Form.useWatch('hasExposure', form);

    useEffect(() => {
        if (!id) {
            message.error('缺少个案ID');
            navigate('/cases');
            return;
        }

        (async () => {
            setLoading(true);
            try {
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

                const dvMap = new Map(investigationEvent.dataValues.map(dv => [dv.dataElement, dv.value]));

                const exposure = dvMap.get('DeExposHst1') || '';
                const contact = dvMap.get('DeContHst01') || '';
                const travel = dvMap.get('DeTravHst01') || '';

                form.setFieldsValue({
                    hasExposure: !!exposure,
                    exposure,
                    hasContact: !!contact,
                    contact,
                    hasTravel: !!travel,
                    travel,
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

            const dataValues = [];
            if (values.hasExposure && values.exposure) {
                dataValues.push({ dataElement: 'DeExposHst1', value: values.exposure });
            }
            if (values.hasContact && values.contact) {
                dataValues.push({ dataElement: 'DeContHst01', value: values.contact });
            }
            if (values.hasTravel && values.travel) {
                dataValues.push({ dataElement: 'DeTravHst01', value: values.travel });
            }

            const result = await updateEvents([{
                event: eventUid,
                program: PROGRAM_ID,
                programStage: PROGRAM_STAGE_INVESTIGATION_ID,
                enrollment,
                orgUnit,
                status: 'ACTIVE',
                occurredAt,
                dataValues,
            }]);

            if (result.status === 'OK') {
                message.success('流行病学信息更新成功!');
                navigate(`/cases/${id}`);
            } else {
                message.error('更新失败，请检查数据');
                console.error('Import result:', result);
            }
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
                <Title level={4}>编辑流行病学信息</Title>
                <Form form={form} layout="vertical">
                    <Card title="暴露史" style={{ marginBottom: 24 }}>
                        <Form.Item label="是否有疫区暴露史?" name="hasExposure" initialValue={false}>
                            <Radio.Group>
                                <Radio value={true}>是</Radio>
                                <Radio value={false}>否</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label="暴露详情"
                            name="exposure"
                            rules={hasExposure ? [
                                { required: true, message: '请输入暴露详情' },
                                { min: 10, max: 1000, message: '暴露详情10-1000个字符' }
                            ] : []}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="请详细描述暴露史（地点、时间、暴露源等）"
                                disabled={!hasExposure}
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Card>

                    <Card title="接触史" style={{ marginBottom: 24 }}>
                        <Form.Item label="是否有确诊/疑似病例接触史?" name="hasContact" initialValue={false}>
                            <Radio.Group>
                                <Radio value={true}>是</Radio>
                                <Radio value={false}>否</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label="接触详情"
                            name="contact"
                            rules={hasContact ? [
                                { required: true, message: '请输入接触详情' },
                                { min: 10, max: 1000, message: '接触详情10-1000个字符' }
                            ] : []}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="请详细描述接触史（接触对象、接触方式、接触时长等）"
                                disabled={!hasContact}
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Card>

                    <Card title="旅行史">
                        <Form.Item label="近14天是否有外出旅行?" name="hasTravel" initialValue={false}>
                            <Radio.Group>
                                <Radio value={true}>是</Radio>
                                <Radio value={false}>否</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label="旅行详情"
                            name="travel"
                            rules={hasTravel ? [
                                { required: true, message: '请输入旅行详情' },
                                { min: 10, max: 1000, message: '旅行详情10-1000个字符' }
                            ] : []}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="请详细描述旅行史（交通工具、途经地点、住宿情况等）"
                                disabled={!hasTravel}
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Card>
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

export default EditEpiInfo;