import { Descriptions, Typography, Divider } from 'antd'; // Removed Tag, not used
import type { FormInstance } from 'antd';
import moment from 'moment';
import type { Dhis2OptionSet } from '../../dhis2'; // Import Dhis2OptionSet

const { Title } = Typography;

interface Step4ConfirmProps {
    form: FormInstance;
    diseaseCodesOptionSet: Dhis2OptionSet | null; // Add this prop
}

const Step4Confirm = ({ form, diseaseCodesOptionSet }: Step4ConfirmProps) => { // Receive diseaseCodesOptionSet
    const values = form.getFieldsValue(true);

    const formatDate = (date: moment.Moment | undefined) => date ? date.format('YYYY-MM-DD') : '未填写';

    const getDiseaseName = (diseaseId: string | undefined) => {
        if (!diseaseCodesOptionSet || !diseaseId) return '未选择';
        const disease = diseaseCodesOptionSet.options.find(d => d.id === diseaseId); // Use optionSet
        return disease ? disease.name : '未选择';
    };

    const renderBoolean = (value: boolean | undefined) => value ? '是' : (value === false ? '否' : '未填写');

    const renderSymptoms = (symptoms: string[] | undefined, otherSymptoms: string | undefined) => {
        if (!symptoms || symptoms.length === 0) return '无';
        const symptomLabels: { [key: string]: string } = {
            fever: '发热',
            cough: '咳嗽',
            fatigue: '乏力',
            soreThroat: '咽痛',
            headache: '头痛',
            diarrhea: '腹泻',
            other: '其他',
        };
        const displayedSymptoms = symptoms.map(s => symptomLabels[s] || s);
        if (symptoms.includes('other') && otherSymptoms) {
            displayedSymptoms[displayedSymptoms.indexOf('其他')] = `其他 (${otherSymptoms})`;
        }
        return displayedSymptoms.join(', ');
    };

    return (
        <div>
            <Title level={4}>确认提交</Title>
            <p>请核对您填写的信息，确认无误后提交。</p>
            
            <Title level={5} style={{ marginTop: 24 }}>患者基本信息</Title>
            <Divider />
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="疾病类型">{getDiseaseName(values.diseaseId)}</Descriptions.Item>
                <Descriptions.Item label="患者姓名">{values.patientName}</Descriptions.Item>
                <Descriptions.Item label="性别">{values.gender === 'male' ? '男' : (values.gender === 'female' ? '女' : '未填写')}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{values.idCard}</Descriptions.Item>
                <Descriptions.Item label="出生日期">{formatDate(values.dob)}</Descriptions.Item>
                <Descriptions.Item label="年龄">{values.age ? `${values.age} 岁` : '未填写'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{values.phone}</Descriptions.Item>
                <Descriptions.Item label="现住地址" span={2}>{values.address}</Descriptions.Item>
            </Descriptions>
            
            <Title level={5} style={{ marginTop: 24 }}>报告信息</Title>
            <Divider />
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="报告单位">{values.reportUnit}</Descriptions.Item>
                <Descriptions.Item label="报告人员">{values.reporter}</Descriptions.Item>
                <Descriptions.Item label="报告日期">{formatDate(values.reportDate)}</Descriptions.Item>
                <Descriptions.Item label="症状开始日期">{formatDate(values.symptomOnsetDate)}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>流行病学信息</Title>
            <Divider />
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="疫区暴露史">{renderBoolean(values.hasExposure)}</Descriptions.Item>
                {values.hasExposure && <Descriptions.Item label="暴露详情">{values.exposureHistory}</Descriptions.Item>}

                <Descriptions.Item label="确诊/疑似病例接触史">{renderBoolean(values.hasContact)}</Descriptions.Item>
                {values.hasContact && (
                    <>
                        <Descriptions.Item label="接触时间">{formatDate(values.contactDate)}</Descriptions.Item>
                        <Descriptions.Item label="接触地点">{values.contactLocation}</Descriptions.Item>
                        <Descriptions.Item label="接触详情">{values.contactHistory}</Descriptions.Item>
                    </>
                )}

                <Descriptions.Item label="近14天外出旅行史">{renderBoolean(values.hasTravel)}</Descriptions.Item>
                {values.hasTravel && (
                    <>
                        <Descriptions.Item label="出发时间">{formatDate(values.travelStartDate)}</Descriptions.Item>
                        <Descriptions.Item label="返回时间">{formatDate(values.travelEndDate)}</Descriptions.Item>
                        <Descriptions.Item label="目的地">{values.travelDestination}</Descriptions.Item>
                        <Descriptions.Item label="旅行详情">{values.travelHistory}</Descriptions.Item>
                    </>
                )}
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>诊断信息</Title>
            <Divider />
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="初步诊断">{values.initialDiagnosis}</Descriptions.Item>
                <Descriptions.Item label="确诊诊断">{values.confirmedDiagnosis || '未填写'}</Descriptions.Item>
                <Descriptions.Item label="诊断日期">{formatDate(values.diagnosisDate)}</Descriptions.Item>
                <Descriptions.Item label="个案来源">{values.caseSource}</Descriptions.Item>
                <Descriptions.Item label="症状" span={2}>
                    {renderSymptoms(values.symptoms, values.otherSymptoms)}
                </Descriptions.Item>
            </Descriptions>
        </div>
    );
};

export default Step4Confirm;