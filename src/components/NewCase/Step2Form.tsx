import { Form, Input, DatePicker, Row, Col, Radio, Typography, Divider, Card } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { Dhis2ProgramMetadata } from '../../dhis2';

const { Title } = Typography;

interface Step2FormProps {
    form: FormInstance;
    programMetadata: Dhis2ProgramMetadata | null;
    diseaseCodesOptionSet: any;
    genderOptionSet: any;
    caseSourceOptionSet: any;
    currentUser: any;
    organisationUnits: any;
    checkIdDuplicate: any;
}

const Step2Form = ({ form }: Step2FormProps) => {
    const hasExposure = Form.useWatch('hasExposure', form);
    const hasContact = Form.useWatch('hasContact', form);
    const hasTravel = Form.useWatch('hasTravel', form);

    return (
        <>
            <Title level={4}>流行病学信息</Title>
            <Divider />
            <Card title="暴露史" style={{ marginBottom: 24 }}>
                <Form.Item
                    label="是否有疫区暴露史?"
                    name="hasExposure"
                    rules={[{ required: true, message: '请选择是否有疫区暴露史' }]}
                >
                    <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                {hasExposure && (
                    <Form.Item
                        label="暴露详情"
                        name="exposureHistory"
                        rules={[{ required: true, message: '请详细描述暴露史', min: 10, max: 1000 }]}
                    >
                        <Input.TextArea rows={3} placeholder="请详细描述暴露史" />
                    </Form.Item>
                )}
            </Card>
            <Card title="接触史" style={{ marginBottom: 24 }}>
                <Form.Item
                    label="是否有确诊/疑似病例接触史?"
                    name="hasContact"
                    rules={[{ required: true, message: '请选择是否有接触史' }]}
                >
                    <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                {hasContact && (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="接触时间"
                                    name="contactDate"
                                    rules={[{ required: true, message: '请选择接触时间' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="接触地点"
                                    name="contactLocation"
                                    rules={[{ required: true, message: '请输入接触地点' }]}
                                >
                                    <Input placeholder="请输入接触地点" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            label="接触详情"
                            name="contactHistory"
                            rules={[{ required: true, message: '请详细描述接触史', min: 10, max: 1000 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请详细描述接触史" />
                        </Form.Item>
                    </>
                )}
            </Card>
            <Card title="旅行史">
                <Form.Item
                    label="近14天是否有外出旅行?"
                    name="hasTravel"
                    rules={[{ required: true, message: '请选择是否有旅行史' }]}
                >
                    <Radio.Group>
                        <Radio value={true}>是</Radio>
                        <Radio value={false}>否</Radio>
                    </Radio.Group>
                </Form.Item>
                {hasTravel && (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="出发时间"
                                    name="travelStartDate"
                                    rules={[{ required: true, message: '请选择出发时间' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="返回时间"
                                    name="travelEndDate"
                                    rules={[
                                        { required: true, message: '请选择返回时间' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || !getFieldValue('travelStartDate') || value.isSameOrAfter(getFieldValue('travelStartDate'))) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('返回时间不能早于出发时间!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            label="目的地"
                            name="travelDestination"
                            rules={[{ required: true, message: '请输入目的地' }]}
                        >
                            <Input placeholder="请输入目的地" />
                        </Form.Item>
                        <Form.Item
                            label="旅行详情"
                            name="travelHistory"
                            rules={[{ required: true, message: '请详细描述旅行史', min: 10, max: 1000 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请详细描述旅行史" />
                        </Form.Item>
                    </>
                )}
            </Card>
        </>
    );
};

export default Step2Form;