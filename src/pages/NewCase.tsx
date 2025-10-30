import { useState, useEffect } from 'react';
import { Steps, Button, Card, Space, message, Row, Col, Typography, Form, Spin, Modal, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import Step1Form from '../components/NewCase/Step1Form';
import Step2Form from '../components/NewCase/Step2Form';
import Step3Form from '../components/NewCase/Step3Form';
import Step4Confirm from '../components/NewCase/Step4Confirm';
import moment from 'moment';
import type { CaseFormData } from '../types/forms';
import { useDhis2Data } from '../hooks/useDhis2Data';
import {
    checkIdDuplicate,
    createTEIAndEnrollment,
    createEvent,
    findProgramAttribute,
    findDataElement,
    getOptionCodeByName,
} from '../dhis2';
import type {
    Dhis2ProgramMetadata,
    Dhis2OptionSet,
    Dhis2User,
    Dhis2OrganisationUnit,
    Dhis2TEIResponse,
    Dhis2ApiResponse,
} from '../dhis2';

const { Step } = Steps;
const { Title } = Typography;

// DHIS2 IDs as per API Contract for Program 'PrgCaseMgt1'
const PROGRAM_ID = 'PrgCaseMgt1';
const PROGRAM_STAGE_INVESTIGATION_ID = 'PsInvestig1'; // '个案调查' Stage ID
const TRACKED_ENTITY_TYPE_ID = 'TetPerson01';

// TEI Attributes
const ATR_FULL_NAME = 'AtrFullNm01';
const ATR_NATIONAL_ID = 'AtrNatnlId1';
const ATR_GENDER = 'AtrGender01';
const ATR_AGE = 'AtrAge00001';
const ATR_PHONE = 'AtrPhone001';
const ATR_ADDRESS = 'AtrAddr0001';

// Enrollment Attributes
const ATR_DISEASE_CODE = 'AtrDiseaCd1';
const ATR_REPORT_ORG = 'AtrRptOrg01';
const ATR_REPORT_DATE = 'AtrRptDt001';
const ATR_SYMPTOM_ONSET_DATE = 'AtrSymptDt1';
const ATR_CASE_SOURCE = 'AtrCaseSrc1';

// Event Data Elements for '个案调查' stage (PsInvestig1)
const DE_INITIAL_DIAGNOSIS = 'DeInitDiag1';
const DE_CASE_STATUS = 'DeCaseStat1'; // Assuming a data element for initial case status
const DE_EXPOSURE_HISTORY = 'DeExposHst1'; // Epidemiological fields
const DE_CONTACT_HISTORY = 'DeContHst01';
const DE_TRAVEL_HISTORY = 'DeTravHst01';
const DE_SYMPTOMS = 'DeSymptoms01'; // Assuming a data element for combined symptoms
const DE_CONFIRMED_DIAGNOSIS = 'DeCnfrmDiag1'; // Assuming a data element for confirmed diagnosis
const DE_PUSH_EPI = 'DePushEpi01'; // Example for a boolean data element

// Map Ant Design form gender to DHIS2 gender codes
const GENDER_MAP: { [key: string]: string } = {
    male: 'MALE',
    female: 'FEMALE',
    unknown: 'UNKNOWN',
};

const stepsConfig = [
    // typing via any for dynamic content factory to avoid generic coupling overflow
    { title: '基本信息', content: (form: any, dhis2Data: any) => <Step1Form form={form} {...dhis2Data} /> },
    { title: '流行病学', content: (form: any, dhis2Data: any) => <Step2Form form={form} {...dhis2Data} /> },
    { title: '诊断信息', content: (form: any, dhis2Data: any) => <Step3Form form={form} {...dhis2Data} /> },
    { title: '确认提交', content: (form: any, dhis2Data: any) => <Step4Confirm form={form} diseaseCodesOptionSet={dhis2Data.diseaseCodesOptionSet} /> },
];

const NewCase = () => {
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm<CaseFormData>();
    const navigate = useNavigate();

    const { data: dhis2Data, loading: dhis2Loading, error: dhis2Error } = useDhis2Data();
    const { currentUser, organisationUnits, diseaseCodesOptionSet, genderOptionSet, caseSourceOptionSet, programMetadata } = dhis2Data;

    useEffect(() => {
        if (currentUser && organisationUnits.length > 0 && !dhis2Loading) {
            const userOrgUnit = currentUser.organisationUnits[0];
            form.setFieldsValue({
                reportUnit: userOrgUnit ? userOrgUnit.name : '未知单位',
                reporter: `${currentUser.firstName || ''}${currentUser.surname || ''}` || currentUser.username,
                reportDate: moment(),
                hasExposure: false,
                hasContact: false,
                hasTravel: false,
            });
        }
    }, [currentUser, organisationUnits, dhis2Loading, form]);

    if (dhis2Loading) {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} tip="加载DHIS2数据..." />;
    }
    if (dhis2Error) {
        return <Alert message="错误" description={`加载DHIS2数据失败: ${dhis2Error}`} type="error" showIcon />;
    }
    if (!programMetadata || !diseaseCodesOptionSet || !genderOptionSet || !caseSourceOptionSet || !currentUser || organisationUnits.length === 0) {
        return <Alert message="错误" description="DHIS2元数据不完整，无法加载表单。" type="error" showIcon />;
    }

    const next = async () => {
        try {
            await form.validateFields();
            setCurrent(current + 1);
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
            message.error('请填写完整当前步骤的必填项！');
        }
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            const values = form.getFieldsValue(true);
            const userOrgUnitId = currentUser?.organisationUnits[0]?.id;
            if (!userOrgUnitId) {
                message.error('无法获取当前用户机构信息，请检查DHIS2配置。');
                return;
            }

            const teiPayload = {
                trackedEntityType: TRACKED_ENTITY_TYPE_ID,
                orgUnit: userOrgUnitId,
                attributes: [
                    { attribute: ATR_FULL_NAME, value: values.patientName },
                    { attribute: ATR_NATIONAL_ID, value: values.idCard },
                    { attribute: ATR_GENDER, value: GENDER_MAP[values.gender] || 'UNKNOWN' },
                    { attribute: ATR_AGE, value: values.age.toString() },
                    { attribute: ATR_PHONE, value: values.phone },
                    { attribute: ATR_ADDRESS, value: values.address },
                ].filter((attr) => attr.value !== undefined && attr.value !== null && attr.value !== ''),
                enrollments: [
                    {
                        program: PROGRAM_ID,
                        orgUnit: userOrgUnitId,
                        enrollmentDate: values.reportDate.format('YYYY-MM-DD'),
                        incidentDate: values.symptomOnsetDate.format('YYYY-MM-DD'),
                        attributes: [
                            {
                                attribute: ATR_DISEASE_CODE,
                                value:
                                    diseaseCodesOptionSet.options.find((opt) => opt.id === values.diseaseId)?.code ||
                                    values.diseaseId,
                            },
                            { attribute: ATR_REPORT_ORG, value: userOrgUnitId },
                            { attribute: ATR_REPORT_DATE, value: values.reportDate.format('YYYY-MM-DD') },
                            { attribute: ATR_SYMPTOM_ONSET_DATE, value: values.symptomOnsetDate.format('YYYY-MM-DD') },
                            { attribute: ATR_CASE_SOURCE, value: getOptionCodeByName(caseSourceOptionSet, values.caseSource as any) },
                        ].filter((attr) => attr.value !== undefined && attr.value !== null && attr.value !== ''),
                    },
                ],
            };

            const teiResponse: Dhis2ApiResponse = await createTEIAndEnrollment(teiPayload);
            if (teiResponse.status === 'ERROR' || teiResponse.response?.status === 'ERROR' || (teiResponse.response?.conflicts && teiResponse.response.conflicts.length > 0)) {
                let errorMessage = `创建TEI或Enrollment失败：${teiResponse.response?.description || ''}`;
                if (teiResponse.response?.conflicts && teiResponse.response.conflicts.length > 0) {
                    errorMessage += `\n冲突详情: ${teiResponse.response.conflicts.map(c => `${c.object}: ${c.value}`).join('; ')}`;
                } else if (teiResponse.response?.message) {
                    errorMessage += `\n${teiResponse.response.message}`;
                }
                Modal.error({
                    title: '提交失败',
                    content: errorMessage,
                });
                return;
            }
            const teiId = teiResponse.response?.importSummaries?.[0]?.reference;
            const enrollmentId = teiResponse.response?.importSummaries?.[0]?.enrollments?.importSummaries?.[0]?.reference;
            if (!teiId || !enrollmentId) {
                message.error('未能获取到新创建的TEI或Enrollment ID。请检查DHIS2响应。');
                return;
            }

            const dataValues: { dataElement: string; value: string }[] = [
                { dataElement: DE_INITIAL_DIAGNOSIS, value: values.initialDiagnosis },
                { dataElement: DE_CASE_STATUS, value: 'NEW' },
                { dataElement: DE_PUSH_EPI, value: 'false' },
            ];

            if (values.hasExposure && values.exposureHistory) {
                dataValues.push({ dataElement: DE_EXPOSURE_HISTORY, value: values.exposureHistory });
            }
            if (values.hasContact && values.contactHistory) {
                const contactDetails = `时间: ${values.contactDate?.format('YYYY-MM-DD') || '未知'}, 地点: ${
                    values.contactLocation || '未知'
                }, 详情: ${values.contactHistory}`;
                dataValues.push({ dataElement: DE_CONTACT_HISTORY, value: contactDetails });
            }
            if (values.hasTravel && values.travelHistory) {
                const travelDetails = `出发: ${values.travelStartDate?.format('YYYY-MM-DD') || '未知'}, 返回: ${
                    values.travelEndDate?.format('YYYY-MM-DD') || '未知'
                }, 目的地: ${values.travelDestination || '未知'}, 详情: ${values.travelHistory}`;
                dataValues.push({ dataElement: DE_TRAVEL_HISTORY, value: travelDetails });
            }
            if (values.symptoms && values.symptoms.length > 0) {
                const symptomLabels: { [key: string]: string } = {
                    fever: '发热',
                    cough: '咳嗽',
                    fatigue: '乏力',
                    soreThroat: '咽痛',
                    headache: '头痛',
                    diarrhea: '腹泻',
                    other: '其他',
                };
                const symptomString =
                    values.symptoms
                        .map((s: string) => symptomLabels[s] || s)
                        .join(',') +
                    (values.symptoms.includes('other') && values.otherSymptoms ? ` (${values.otherSymptoms})` : '');
                dataValues.push({ dataElement: DE_SYMPTOMS, value: symptomString });
            }
            if (values.confirmedDiagnosis) {
                dataValues.push({ dataElement: DE_CONFIRMED_DIAGNOSIS, value: values.confirmedDiagnosis });
            }

            const eventPayload = {
                program: PROGRAM_ID,
                programStage: PROGRAM_STAGE_INVESTIGATION_ID,
                enrollment: enrollmentId,
                orgUnit: userOrgUnitId,
                eventDate: values.diagnosisDate.format('YYYY-MM-DD'),
                status: 'ACTIVE',
                trackedEntityInstance: teiId,
                dataValues: dataValues.filter((dv) => dv.value !== undefined && dv.value !== null && dv.value !== ''),
            };

            const eventResponse: Dhis2ApiResponse = await createEvent(eventPayload);
            if (eventResponse.status === 'ERROR' || eventResponse.response?.status === 'ERROR' || (eventResponse.response?.conflicts && eventResponse.response.conflicts.length > 0)) {
                let errorMessage = `创建Event失败：${eventResponse.response?.description || ''}`;
                if (eventResponse.response?.conflicts && eventResponse.response.conflicts.length > 0) {
                    errorMessage += `\n冲突详情: ${eventResponse.response.conflicts.map(c => `${c.object}: ${c.value}`).join('; ')}`;
                } else if (eventResponse.response?.message) {
                    errorMessage += `\n${eventResponse.response.message}`;
                }
                Modal.error({
                    title: '提交失败',
                    content: errorMessage,
                });
                return;
            }

            message.success('个案创建成功!');
            navigate(`/cases/${teiId}`);
        } catch (errorInfo: any) {
            console.error('Form submission failed:', errorInfo);
            if (errorInfo.errorFields) {
                message.error('提交失败，请检查所有必填项！');
            } else {
                // Ensure a message is always shown for unexpected errors
                message.error(`提交失败: ${errorInfo.message || '未知错误，请查看控制台获取详情。'}`);
            }
        }
    };

    const dhis2DataForChildren = {
        programMetadata,
        diseaseCodesOptionSet,
        genderOptionSet,
        caseSourceOptionSet,
        currentUser,
        organisationUnits,
        checkIdDuplicate,
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>新增个案调查表</Title>
                </Col>
                <Col>
                    <Space>
                        <Button key="2">保存草稿</Button>
                        <Button key="1" onClick={() => navigate('/cases')}>取消</Button>
                    </Space>
                </Col>
            </Row>
            <Card>
                <Steps current={current}>
                    {stepsConfig.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>
                <div style={{ marginTop: 24, minHeight: 400 }}>
                    <Form form={form} layout="vertical">
                        {stepsConfig[current].content(form, dhis2DataForChildren)}
                    </Form>
                </div>
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Space>
                        {current > 0 && (
                            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                                上一步
                            </Button>
                        )}
                        {current < stepsConfig.length - 1 && (
                            <Button type="primary" onClick={() => next()}>
                                下一步
                            </Button>
                        )}
                        {current === stepsConfig.length - 1 && (
                            <Button type="primary" onClick={handleSubmit}>
                                提交
                            </Button>
                        )}
                    </Space>
                </div>
            </Card>
        </Space>
    );
};

export default NewCase;