import { Form, Input, Select, DatePicker, Row, Col, Radio, Typography, Divider, message, Modal, Alert } from 'antd';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { Dhis2OptionSet, Dhis2User, Dhis2OrganisationUnit, Dhis2TEIResponse } from '../../dhis2';

const { Title } = Typography;
const { Option } = Select;

interface Step1FormProps {
    form: FormInstance;
    diseaseCodesOptionSet: Dhis2OptionSet | null;
    genderOptionSet: Dhis2OptionSet | null;
    currentUser: Dhis2User | null;
    organisationUnits: Dhis2OrganisationUnit[];
    checkIdDuplicate: (nationalId: string, orgUnitId: string) => Promise<Dhis2TEIResponse>;
}

const Step1Form = ({ form, diseaseCodesOptionSet, genderOptionSet, currentUser, organisationUnits, checkIdDuplicate }: Step1FormProps) => {
    const handleIdCardBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const idCard = e.target.value;
        if (!idCard) return;
        const idCardPattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        if (!idCardPattern.test(idCard)) {
            form.validateFields(['idCard']);
            return;
        }
        const userOrgUnitId = currentUser?.organisationUnits[0]?.id;
        if (!userOrgUnitId) {
            message.error('无法获取当前用户机构信息进行查重。');
            return;
        }
        try {
            const response = await checkIdDuplicate(idCard, userOrgUnitId);
            if (response.trackedEntityInstances.length > 0) {
                const existingTEI = response.trackedEntityInstances[0];
                const patientNameAttr = existingTEI.attributes.find(attr => attr.attribute === 'AtrFullNm01');
                const patientName = patientNameAttr ? patientNameAttr.value : '未知姓名';
                Modal.confirm({
                    title: '该患者已登记',
                    content: (
                        <div>
                            <p>身份证号 <strong>{idCard}</strong> 已存在于系统中，患者姓名：<strong>{patientName}</strong>。</p>
                            <p>您是否要查看已有记录或继续创建（不同Program可共享TEI）？</p>
                        </div>
                    ),
                    okText: '继续创建',
                    cancelText: '查看已有记录',
                    onCancel: () => {
                        message.info(`导航到 TEI: ${existingTEI.trackedEntityInstance} 的详情页`);
                    },
                    onOk: () => {
                        message.info('您选择了继续创建。');
                    },
                });
            }
        } catch (error: any) {
            console.error('ID card duplicate check failed:', error);
            message.error(`身份证查重失败: ${error.message}`);
        }
        if (idCard.length === 18) {
            const birthYear = parseInt(idCard.substring(6, 10), 10);
            const birthMonth = parseInt(idCard.substring(10, 12), 10) - 1;
            const birthDay = parseInt(idCard.substring(12, 14), 10);
            const dob = moment([birthYear, birthMonth, birthDay]);
            if (dob.isValid() && dob.isBefore(moment())) {
                form.setFieldsValue({ dob });
                const age = moment().diff(dob, 'years');
                form.setFieldsValue({ age });
            }
        }
    };

    return (
        <>
            <Title level={4}>患者基本信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        label="疾病类型"
                        name="diseaseId"
                        rules={[{ required: true, message: '请选择疾病类型' }]}
                    >
                        <Select placeholder="请选择疾病">
                            {diseaseCodesOptionSet?.options.map(disease => (
                                <Option key={disease.id} value={disease.id}>
                                    {disease.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
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
                            {genderOptionSet?.options.map(option => (
                                <Radio key={option.id} value={option.code.toLowerCase()}>{option.name}</Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="身份证号"
                        name="idCard"
                        rules={[
                            { required: true, message: '请输入身份证号' },
                            { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' }
                        ]}
                        help="系统将自动检测重复病例"
                    >
                        <Input placeholder="请输入身份证号" onBlur={handleIdCardBlur} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        label="出生日期"
                        name="dob"
                    >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                    </Form.Item>
                </Col>
                <Col span={6}>
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
                        label="现住地址"
                        name="address"
                        rules={[{ required: true, message: '请输入现住地址', min: 5, max: 200 }]}
                    >
                        <Input.TextArea rows={2} placeholder="请输入现住址" />
                    </Form.Item>
                </Col>
            </Row>
            <Title level={4} style={{ marginTop: 24 }}>报告信息</Title>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="报告单位"
                        name="reportUnit"
                    >
                        <Input readOnly />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="报告人员"
                        name="reporter"
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
            </Row>
        </>
    );
};
export default Step1Form;