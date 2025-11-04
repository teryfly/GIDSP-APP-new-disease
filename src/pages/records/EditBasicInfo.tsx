import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography, Row, Col, Input, Radio, DatePicker } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCaseDetails, updateTrackedEntities } from '../../services/caseDetailsService';

const { Title } = Typography;

const EditBasicInfo = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [orgUnit, setOrgUnit] = useState<string>('');
    const [trackedEntityType, setTrackedEntityType] = useState<string>('');

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
                setOrgUnit(tei.orgUnit);
                setTrackedEntityType(tei.trackedEntityType);

                const attrMap = new Map(tei.attributes.map(a => [a.attribute, a.value]));

                const fullName = attrMap.get('AtrFullNm01') || '';
                const genderCode = attrMap.get('AtrGender01') || '';
                const nationalId = attrMap.get('AtrNatnlId1') || '';
                const age = attrMap.get('AtrAge00001') || '';
                const phone = attrMap.get('AtrPhone001') || '';
                const address = attrMap.get('AtrAddr0001') || '';

                // Parse address (assuming format: "省 市 区 详细地址")
                const addressParts = address.split(' ').filter(Boolean);
                
                // Map gender code to Chinese
                let genderZh = '未知';
                if (genderCode === 'MALE') genderZh = '男';
                else if (genderCode === 'FEMALE') genderZh = '女';

                // Auto-parse DOB from nationalId if possible
                let dob = undefined;
                if (nationalId.length === 18) {
                    const y = Number(nationalId.slice(6, 10));
                    const m = Number(nationalId.slice(10, 12));
                    const d = Number(nationalId.slice(12, 14));
                    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                        dob = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                    }
                }

                form.setFieldsValue({
                    fullName,
                    genderZh,
                    nationalId,
                    dob,
                    age: age ? Number(age) : undefined,
                    phone,
                    addressProvince: addressParts[0] || '',
                    addressCity: addressParts[1] || '',
                    addressDistrict: addressParts[2] || '',
                    addressDetail: addressParts.slice(3).join(' ') || '',
                });
            } catch (e: any) {
                message.error(`加载失败: ${e.message}`);
                navigate(`/cases/${id}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate, form]);

    const onNationalIdBlur = () => {
        const nationalId: string = form.getFieldValue('nationalId') || '';
        if (nationalId.length === 18) {
            const y = Number(nationalId.slice(6, 10));
            const m = Number(nationalId.slice(10, 12));
            const d = Number(nationalId.slice(12, 14));
            if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                const dob = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                const age = dayjs().diff(dob, 'year');
                form.setFieldsValue({ dob, age });
            }
        }
    };

    const handleSubmit = async () => {
        if (!id || !orgUnit || !trackedEntityType) {
            message.error('缺少必要的上下文信息');
            return;
        }

        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // Map gender back to code
            let genderCode = 'UNKNOWN';
            if (values.genderZh === '男') genderCode = 'MALE';
            else if (values.genderZh === '女') genderCode = 'FEMALE';

            // Combine address parts
            const fullAddress = [
                values.addressProvince,
                values.addressCity,
                values.addressDistrict,
                values.addressDetail
            ].filter(Boolean).join(' ');

            const attributes = [
                { attribute: 'AtrFullNm01', value: values.fullName },
                { attribute: 'AtrGender01', value: genderCode },
                { attribute: 'AtrNatnlId1', value: values.nationalId },
                { attribute: 'AtrAddr0001', value: fullAddress },
            ];

            if (values.age) {
                attributes.push({ attribute: 'AtrAge00001', value: String(values.age) });
            }
            if (values.phone) {
                attributes.push({ attribute: 'AtrPhone001', value: values.phone });
            }

            const result = await updateTrackedEntities([{
                trackedEntity: id,
                trackedEntityType,
                orgUnit,
                attributes,
            }]);

            if (result.status === 'OK') {
                message.success('基本信息更新成功!');
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
                <Title level={4}>编辑基本信息</Title>
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="患者姓名"
                                name="fullName"
                                rules={[
                                    { required: true, message: '请输入患者姓名' },
                                    { min: 2, max: 50, message: '姓名长度为2-50个字符' },
                                    { pattern: /^[\u4e00-\u9fa5a-zA-Z\s·]+$/, message: '姓名只能包含中文、英文、空格和·' }
                                ]}
                            >
                                <Input placeholder="请输入姓名" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="性别" name="genderZh" rules={[{ required: true, message: '请选择性别' }]}>
                                <Radio.Group>
                                    <Radio value="男">男</Radio>
                                    <Radio value="女">女</Radio>
                                    <Radio value="未知">未知</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="身份证号"
                                name="nationalId"
                                rules={[
                                    { required: true, message: '请输入身份证号' },
                                    {
                                        pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
                                        message: '身份证号格式不正确'
                                    },
                                ]}
                            >
                                <Input placeholder="请输入18位身份证号" onBlur={onNationalIdBlur} maxLength={18} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="出生日期" name="dob">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                    placeholder="自动填充"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="年龄"
                                name="age"
                                rules={[
                                    { type: 'number', transform: (v) => Number(v), min: 0, max: 150, message: '年龄范围0-150岁' }
                                ]}
                            >
                                <Input suffix="岁" placeholder="自动填充" type="number" min={0} max={150} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="联系电话"
                                name="phone"
                                rules={[
                                    { required: true, message: '请输入联系电话' },
                                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
                                ]}
                            >
                                <Input placeholder="请输入11位手机号" maxLength={11} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="省/直辖市"
                                name="addressProvince"
                                rules={[
                                    { required: true, message: '请选择省/直辖市' },
                                    { min: 2, max: 50, message: '省份名称2-50个字符' }
                                ]}
                            >
                                <Input placeholder="如：北京市" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="市"
                                name="addressCity"
                                rules={[
                                    { required: true, message: '请选择市' },
                                    { min: 2, max: 50, message: '城市名称2-50个字符' }
                                ]}
                            >
                                <Input placeholder="如：北京市" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="区/县"
                                name="addressDistrict"
                                rules={[
                                    { required: true, message: '请选择区/县' },
                                    { min: 2, max: 50, message: '区县名称2-50个字符' }
                                ]}
                            >
                                <Input placeholder="如：朝阳区" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="详细地址"
                                name="addressDetail"
                                rules={[
                                    { required: true, message: '请输入详细地址' },
                                    { min: 5, max: 200, message: '详细地址5-200个字符' }
                                ]}
                            >
                                <Input placeholder="街道、小区、楼栋、门牌等详细信息" />
                            </Form.Item>
                        </Col>
                    </Row>
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

export default EditBasicInfo;