import { Form, Input, Select, DatePicker, Radio, Row, Col, Card, Typography } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { TrackingRecordFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface TrackingRecordFormProps {
    form: FormInstance<TrackingRecordFormData>;
    initialValues?: TrackingRecordFormData;
    caseId: string; // The ID of the parent case
}

const TrackingRecordForm = ({ form, initialValues, caseId }: TrackingRecordFormProps) => {
    const trackingType = Form.useWatch('trackingType', form);

    return (
        <Card>
            <Title level={4}>追踪记录</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ ...initialValues, trackingDate: initialValues?.trackingDate || moment(), startDate: initialValues?.startDate || moment(), endDate: initialValues?.endDate || moment() }}
            >
                {/* Hidden field for case association */}
                <Form.Item name="caseId" hidden initialValue={caseId} />

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="追踪日期"
                            name="trackingDate"
                            rules={[{ required: true, message: '请选择追踪日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="追踪类型"
                            name="trackingType"
                            rules={[{ required: true, message: '请选择追踪类型' }]}
                        >
                            <Radio.Group>
                                <Radio value="旅居史">旅居史</Radio>
                                <Radio value="接触史">接触史</Radio>
                                <Radio value="物品暴露史">物品暴露史</Radio>
                                <Radio value="场所暴露史">场所暴露史</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="开始日期"
                            name="startDate"
                            rules={[{ required: true, message: '请选择开始日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="结束日期"
                            name="endDate"
                            rules={[
                                { required: true, message: '请选择结束日期' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startDate = getFieldValue('startDate');
                                        if (!value || !startDate || value.isSameOrAfter(startDate, 'day')) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('结束日期不能早于开始日期!'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="关联地区"
                            name="regionId"
                            rules={[{ required: true, message: '请选择关联地区' }]}
                        >
                            {/* In a real application, this would be a Cascader for 省/市/县 */}
                            <Select placeholder="请选择地区 (模拟)" >
                                <Option value="region1">北京市</Option>
                                <Option value="region2">上海市</Option>
                                <Option value="region3">广州市</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="地点描述"
                            name="locationDescription"
                            rules={[{ required: true, message: '请输入地点描述', min: 10, max: 500 }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入地点描述" />
                        </Form.Item>
                    </Col>
                    {/* Map picker for longitude/latitude would go here */}
                    {trackingType === '接触史' && (
                        <Col span={24}>
                            <Form.Item
                                label="接触人员信息"
                                name="contactPersons"
                                rules={[{ max: 1000, message: '接触人员信息不能超过1000字' }]}
                            >
                                <Input.TextArea rows={2} placeholder="请输入接触人员信息" />
                            </Form.Item>
                        </Col>
                    )}
                    <Col span={24}>
                        <Form.Item
                            label="暴露详情"
                            name="exposureDetails"
                            rules={[{ required: true, message: '请输入暴露详情', min: 10, max: 1000 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请输入暴露详情" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="风险评估"
                            name="riskAssessment"
                            rules={[{ required: true, message: '请选择风险评估' }]}
                        >
                            <Radio.Group>
                                <Radio value="高风险">高风险</Radio>
                                <Radio value="中风险">中风险</Radio>
                                <Radio value="低风险">低风险</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="创建人"
                            name="createdBy"
                            initialValue="当前用户" // Mock current user
                        >
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default TrackingRecordForm;