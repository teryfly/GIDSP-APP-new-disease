import { Form, Input, Select, DatePicker, Row, Col, Typography, Divider, Checkbox } from 'antd';
import type { FormInstance } from 'antd';
import moment, { Moment } from 'moment';
import type { Dhis2OptionSet, Dhis2ProgramMetadata } from '../../dhis2';

const { Title } = Typography;
const { Option } = Select;

interface Step3FormProps {
    form: FormInstance;
    programMetadata: Dhis2ProgramMetadata | null;
    caseSourceOptionSet: Dhis2OptionSet | null;
    diseaseCodesOptionSet: any;
    genderOptionSet: any;
    currentUser: any;
    organisationUnits: any;
    checkIdDuplicate: any;
}

const Step3Form = ({ form, caseSourceOptionSet }: Step3FormProps) => {
    const selectedSymptoms = Form.useWatch('symptoms', form) || [];

    return (
        <>
            <Title level={4}>诊断信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="初步诊断"
                        name="initialDiagnosis"
                        rules={[{ required: true, message: '请输入初步诊断', min: 10, max: 500 }]}
                    >
                        <Input placeholder="请输入初步诊断" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="确诊诊断"
                        name="confirmedDiagnosis"
                    >
                        <Input placeholder="请输入确诊诊断" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="诊断日期"
                        name="diagnosisDate"
                        rules={[
                            { required: true, message: '请选择诊断日期' },
                            // 彻底移除与症状开始日期比较的验证逻辑
                        ]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            disabledDate={(current) => current && current > moment().endOf('day')}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="个案来源"
                        name="caseSource"
                        rules={[{ required: true, message: '请选择来源' }]}
                    >
                        <Select placeholder="请选择来源">
                            {caseSourceOptionSet?.options.map(option => (
                                <Option key={option.id} value={option.name}>
                                    {option.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="症状描述"
                        name="symptoms"
                    >
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row>
                                <Col span={8}><Checkbox value="fever">发热</Checkbox></Col>
                                <Col span={8}><Checkbox value="cough">咳嗽</Checkbox></Col>
                                <Col span={8}><Checkbox value="fatigue">乏力</Checkbox></Col>
                                <Col span={8}><Checkbox value="soreThroat">咽痛</Checkbox></Col>
                                <Col span={8}><Checkbox value="headache">头痛</Checkbox></Col>
                                <Col span={8}><Checkbox value="diarrhea">腹泻</Checkbox></Col>
                                <Col span={8}><Checkbox value="other">其他</Checkbox></Col>
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Col>
                {selectedSymptoms.includes('other') && (
                    <Col span={24}>
                        <Form.Item
                            label="其他症状"
                            name="otherSymptoms"
                            rules={[{ required: true, message: '请描述其他症状', min: 10, max: 500 }]}
                        >
                            <Input.TextArea rows={3} placeholder="请描述其他症状" />
                        </Form.Item>
                    </Col>
                )}
            </Row>
        </>
    );
};

export default Step3Form;