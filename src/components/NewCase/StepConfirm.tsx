import { Card, Descriptions, Typography } from 'antd';

const { Title } = Typography;

interface Props {
  data: Record<string, any>;
}

export default function StepConfirm({ data }: Props) {
  return (
    <Card>
      <Title level={4}>第四步: 确认提交</Title>
      <Descriptions bordered column={2} title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="疾病类型">{data.diseaseName || data.diseaseCode}</Descriptions.Item>
        <Descriptions.Item label="姓名">{data.fullName}</Descriptions.Item>
        <Descriptions.Item label="性别">{data.genderZh}</Descriptions.Item>
        <Descriptions.Item label="身份证号">{data.nationalId}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{data.phone}</Descriptions.Item>
        <Descriptions.Item label="报告单位">{data.reportOrgName}</Descriptions.Item>
        <Descriptions.Item label="报告日期">{data.reportDate}</Descriptions.Item>
        <Descriptions.Item label="症状开始">{data.symptomOnsetDate}</Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>
          {[data.addressProvince, data.addressCity, data.addressDistrict, data.addressDetail].filter(Boolean).join(' ')}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions bordered column={1} title="流行病学信息" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="暴露史">{data.exposure || '无'}</Descriptions.Item>
        <Descriptions.Item label="接触史">{data.contact || '无'}</Descriptions.Item>
        <Descriptions.Item label="旅行史">{data.travel || '无'}</Descriptions.Item>
      </Descriptions>

      <Descriptions bordered column={2} title="诊断信息">
        <Descriptions.Item label="初步诊断">{data.initialDiagnosis}</Descriptions.Item>
        <Descriptions.Item label="确诊诊断">{data.finalDiagnosis || '-'}</Descriptions.Item>
        <Descriptions.Item label="诊断日期">{data.diagnosisDate}</Descriptions.Item>
        <Descriptions.Item label="个案来源">{data.caseSourceName || data.caseSourceCode}</Descriptions.Item>
        <Descriptions.Item label="个案状态">{data.caseStatusName || data.caseStatusCode || '-'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}