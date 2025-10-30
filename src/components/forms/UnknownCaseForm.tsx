import { Form, Input, Select, DatePicker, Radio, Row, Col, Card, Typography } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { UnknownCaseFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface UnknownCaseFormProps {
    form: FormInstance<UnknownCaseFormData>;
    initialValues?: UnknownCaseFormData;
}

const UnknownCaseForm = ({ form, initialValues }: UnknownCaseFormProps) => {
    return (
        <Card>
            <Title level={4}>不明原因病例信息</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ ...initialValues, reportDate: initialValues?.reportDate || moment(), symptomOnsetDate: initialValues?.symptomOnsetDate || moment() }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="患者姓名"
                            name="patientName"
                            rules={[{ required: true, message: '请输入患者姓名', min: 2, max: 50 }]}
                        >
                            <Input placeholder="请输入患者姓名" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="性别"
                            name="gender"
                            rules={[{ required: true, message: '请选择性别' }]}
                        >
                            <Radio.Group>
                                <Radio value="男">男</Radio>
                                <Radio value="女">女</Radio>
                                <Radio value="未知">未知</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="身份证号"
                            name="idCardNo"
                            rules={[
                                { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' }
                            ]}
                            help="系统将自动检测重复病例"
                        >
                            <Input placeholder="请输入身份证号" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="年龄"
                            name="age"
                            rules={[
                                { required: true, message: '请输入年龄' },
                                { type: 'number', min: 0, max: 150, transform: (value) => Number(value), message: '年龄必须在0-150之间' }
                            ]}
                        >
                            <Input suffix="岁" placeholder="请输入年龄" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="联系电话"
                            name="phone"
                            rules={[
                                { required: true, message: '请输入联系电话' },
                                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                            ]}
                        >
                            <Input placeholder="请输入联系电话" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="现住址"
                            name="address"
                            rules={[{ required: true, message: '请输入现住址', min: 5, max: 500 }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入现住址" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="报告单位"
                            name="reportOrgId"
                            initialValue="北京市朝阳区疾控中心" // Mock current user's org
                        >
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="报告人员"
                            name="reportUserId"
                            initialValue="李医生" // Mock current user
                        >
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="报告日期"
                            name="reportDate"
                            rules={[{ required: true, message: '请选择报告日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="症状开始日期"
                            name="symptomOnsetDate"
                            rules={[{ required: true, message: '请选择症状开始日期' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="临床症状描述"
                            name="clinicalSymptoms"
                            rules={[{ required: true, message: '请输入临床症状描述', min: 20, max: 2000 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请详细描述临床症状" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="疑似病原体"
                            name="suspectedPathogen"
                            rules={[{ max: 200, message: '疑似病原体不能超过200字' }]}
                        >
                            <Input placeholder="请输入疑似病原体" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="紧急程度"
                            name="urgencyLevel"
                            rules={[{ required: true, message: '请选择紧急程度' }]}
                        >
                            <Radio.Group>
                                <Radio value="高">高</Radio>
                                <Radio value="中">中</Radio>
                                <Radio value="低">低</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="初步评估"
                            name="initialAssessment"
                            rules={[{ max: 500, message: '初步评估不能超过500字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入初步评估" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default UnknownCaseForm;