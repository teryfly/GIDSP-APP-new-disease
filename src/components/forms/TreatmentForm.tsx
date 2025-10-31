import { Form, Input, Select, DatePicker, Radio, Row, Col, Card, Typography } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { TreatmentFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface TreatmentFormProps {
    form: FormInstance<TreatmentFormData>;
    initialValues?: TreatmentFormData;
    caseId: string; // The ID of the parent case
}

const TreatmentForm = ({ form, initialValues, caseId }: TreatmentFormProps) => {
    const treatmentType = Form.useWatch('treatmentType', form);

    return (
        <Card>
            <Title level={4}>治疗记录</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ ...initialValues, treatmentDate: initialValues?.treatmentDate || moment() }}
            >
                {/* Hidden field for case association */}
                <Form.Item name="caseId" hidden initialValue={caseId} />

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="治疗日期"
                            name="treatmentDate"
                            rules={[{ required: true, message: '请选择治疗日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="治疗类型"
                            name="treatmentType"
                            rules={[{ required: true, message: '请选择治疗类型' }]}
                        >
                            <Radio.Group>
                                <Radio value="门诊">门诊</Radio>
                                <Radio value="住院">住院</Radio>
                                <Radio value="居家隔离">居家隔离</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="医院名称"
                            name="hospitalName"
                            rules={[{ required: true, message: '请输入医院名称', min: 2, max: 200 }]}
                        >
                            <Input placeholder="请输入医院名称" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="科室名称"
                            name="departmentName"
                            rules={[{ min: 2, max: 100, message: '科室名称2-100字' }]}
                        >
                            <Input placeholder="请输入科室名称" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="医生姓名"
                            name="doctorName"
                            rules={[{ min: 2, max: 50, message: '医生姓名2-50字' }]}
                        >
                            <Input placeholder="请输入医生姓名" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="治疗转归"
                            name="treatmentOutcome"
                        >
                            <Select placeholder="请选择">
                                <Option value="治愈">治愈</Option>
                                <Option value="好转">好转</Option>
                                <Option value="无效">无效</Option>
                                <Option value="死亡">死亡</Option>
                                <Option value="转院">转院</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="诊断"
                            name="diagnosis"
                            rules={[{ required: true, message: '请输入诊断', min: 10, max: 500 }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入诊断" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="治疗方案"
                            name="treatmentPlan"
                            rules={[{ required: true, message: '请输入治疗方案', min: 10, max: 1000 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请输入治疗方案" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="用药情况"
                            name="medications"
                            rules={[{ max: 1000, message: '用药情况不能超过1000字' }]}
                        >
                            <Input.TextArea rows={3} placeholder="请输入用药情况" />
                        </Form.Item>
                    </Col>
                    {treatmentType === '住院' && (
                        <Col span={12}>
                            <Form.Item
                                label="出院日期"
                                name="dischargeDate"
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const treatmentDate = getFieldValue('treatmentDate');
                                            if (!value || !treatmentDate || value.isSameOrAfter(treatmentDate, 'day')) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('出院日期不能早于治疗日期!'));
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    )}
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

export default TreatmentForm;