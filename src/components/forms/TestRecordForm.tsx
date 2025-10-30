import { Form, Input, Select, DatePicker, Radio, Row, Col, Card, Typography, Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { TestRecordFormData } from '../../types/forms';

const { Title } = Typography;
const { Option } = Select;

interface TestRecordFormProps {
    form: FormInstance<TestRecordFormData>;
    initialValues?: TestRecordFormData;
    parentType: 'case' | 'unknownCase'; // To distinguish parent record
    parentId: string; // The ID of the parent case or unknown case
}

const TestRecordForm = ({ form, initialValues, parentType, parentId }: TestRecordFormProps) => {
    const testResult = Form.useWatch('testResult', form);

    const uploadProps = {
        name: 'file',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // Mock upload URL
        headers: {
            authorization: 'authorization-text',
        },
        onChange(info: any) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} 文件上传成功`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} 文件上传失败.`);
            }
        },
    };

    return (
        <Card>
            <Title level={4}>检测记录</Title>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ ...initialValues, sampleCollectionDate: initialValues?.sampleCollectionDate || moment() }}
            >
                {/* Hidden fields for parent association */}
                <Form.Item name="caseId" hidden initialValue={parentType === 'case' ? parentId : undefined} />
                <Form.Item name="unknownCaseId" hidden initialValue={parentType === 'unknownCase' ? parentId : undefined} />
                <Form.Item name="testNo" hidden initialValue={initialValues?.testNo || `TEST-${Date.now().toString().slice(-6)}`} /> {/* Mock auto-generated */}


                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="样本采集时间"
                            name="sampleCollectionDate"
                            rules={[{ required: true, message: '请选择样本采集时间' }]}
                        >
                            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="样本类型"
                            name="sampleType"
                            rules={[{ required: true, message: '请选择样本类型' }]}
                        >
                            <Select placeholder="请选择">
                                <Option value="咽拭子">咽拭子</Option>
                                <Option value="血液">血液</Option>
                                <Option value="粪便">粪便</Option>
                                <Option value="尿液">尿液</Option>
                                <Option value="其他">其他</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="检测类型"
                            name="testType"
                            rules={[{ required: true, message: '请选择检测类型' }]}
                        >
                            <Select placeholder="请选择">
                                <Option value="核酸检测">核酸检测</Option>
                                <Option value="抗体检测">抗体检测</Option>
                                <Option value="培养">培养</Option>
                                <Option value="影像学">影像学</Option>
                                <Option value="其他">其他</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="检测机构"
                            name="testOrgName"
                            rules={[{ required: true, message: '请输入检测机构', min: 2, max: 200 }]}
                        >
                            <Input placeholder="请输入检测机构" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="检测日期"
                            name="testDate"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const sampleCollectionDate = getFieldValue('sampleCollectionDate');
                                        if (!value || !sampleCollectionDate || value.isSameOrAfter(sampleCollectionDate, 'day')) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('检测日期不能早于样本采集时间!'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={(current) => current && current > moment().endOf('day')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="检测结果"
                            name="testResult"
                        >
                            <Radio.Group>
                                <Radio value="阳性">阳性</Radio>
                                <Radio value="阴性">阴性</Radio>
                                <Radio value="待定">待定</Radio>
                                <Radio value="不确定">不确定</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    {testResult === '阳性' && (
                        <Col span={24}>
                            <Form.Item
                                label="检出病原体"
                                name="pathogenDetected"
                                rules={[{ max: 200, message: '病原体名称不能超过200字' }]}
                            >
                                <Input placeholder="请输入检出的病原体" />
                            </Form.Item>
                        </Col>
                    )}
                    <Col span={24}>
                        <Form.Item
                            label="结果详情"
                            name="resultDetails"
                            rules={[{ max: 1000, message: '结果详情不能超过1000字' }]}
                        >
                            <Input.TextArea rows={2} placeholder="请输入结果详情" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="检测状态"
                            name="testStatus"
                            rules={[{ required: true, message: '请选择检测状态' }]}
                        >
                            <Radio.Group>
                                <Radio value="待确认">待确认</Radio>
                                <Radio value="已确认">已确认</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="检测报告文件" name="labReportFile">
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />}>上传文件</Button>
                            </Upload>
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

export default TestRecordForm;