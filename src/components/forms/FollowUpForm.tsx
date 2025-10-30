import { Form, Input, Select, DatePicker, Radio, Row, Col, Card, Typography } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { FollowUpFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface FollowUpFormProps {
    form: FormInstance<FollowUpFormData>;
    initialValues?: FollowUpFormData;
    parentType: 'case' | 'unknownCase'; // To distinguish parent record
    parentId: string; // The ID of the parent case or unknown case
}

const FollowUpForm = ({ form, initialValues, parentType, parentId }: FollowUpFormProps) => {
    return (
        <Card>
            <Title level={4}>随访记录</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ ...initialValues, followUpDate: initialValues?.followUpDate || moment() }}
            >
                {/* Hidden fields for parent association */}
                <Form.Item name="caseId" hidden initialValue={parentType === 'case' ? parentId : undefined} />
                <Form.Item name="unknownCaseId" hidden initialValue={parentType === 'unknownCase' ? parentId : undefined} />

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="随访日期"
                            name="followUpDate"
                            rules={[{ required: true, message: '请选择随访日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="随访方式"
                            name="followUpMethod"
                            rules={[{ required: true, message: '请选择随访方式' }]}
                        >
                            <Radio.Group>
                                <Radio value="电话随访">电话随访</Radio>
                                <Radio value="现场随访">现场随访</Radio>
                                <Radio value="线上随访">线上随访</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="随访人员"
                            name="followUpUserId"
                            initialValue="当前用户" // Mock current user
                        >
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="健康状态"
                            name="healthStatus"
                            rules={[{ required: true, message: '请选择健康状态' }]}
                        >
                            <Select placeholder="请选择">
                                <Option value="好转">好转</Option>
                                <Option value="稳定">稳定</Option>
                                <Option value="异常">异常</Option>
                                <Option value="恶化">恶化</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="体温"
                            name="temperature"
                            rules={[
                                { type: 'number', min: 35.0, max: 42.0, transform: (value) => Number(value), message: '体温范围35.0-42.0°C' }
                            ]}
                        >
                            <Input suffix="°C" placeholder="请输入体温" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="治疗依从性"
                            name="treatmentCompliance"
                            rules={[{ required: true, message: '请选择治疗依从性' }]}
                        >
                            <Radio.Group>
                                <Radio value="良好">良好</Radio>
                                <Radio value="一般">一般</Radio>
                                <Radio value="差">差</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="症状描述"
                            name="symptoms"
                            rules={[{ max: 500, message: '症状描述不能超过500字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入症状描述" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="下次随访日期"
                            name="nextFollowUpDate"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const followUpDate = getFieldValue('followUpDate');
                                        if (!value || !followUpDate || value.isAfter(followUpDate, 'day')) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('下次随访日期必须晚于随访日期!'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="备注"
                            name="remarks"
                            rules={[{ max: 500, message: '备注不能超过500字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入备注" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default FollowUpForm;