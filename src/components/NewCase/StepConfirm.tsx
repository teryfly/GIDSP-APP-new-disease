import { Card, Descriptions, Typography, Tag, Space } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Props {
  data: Record<string, any>;
}

export default function StepConfirm({ data }: Props) {
  const address = [data.addressProvince, data.addressCity, data.addressDistrict, data.addressDetail]
    .filter(Boolean)
    .join(' ') || '-';
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('YYYY-MM-DD') : dateStr;
  };

  return (
    <Card>
      <Title level={4}>第四步: 确认提交</Title>
      <Text type="secondary">请仔细核对以下信息，确认无误后提交。提交后将创建个案记录。</Text>
      
      <Descriptions 
        bordered 
        column={2} 
        title="基本信息" 
        style={{ marginTop: 24 }}
        labelStyle={{ fontWeight: 'bold', width: '140px' }}
      >
        <Descriptions.Item label="疾病类型">{data.diseaseName || data.diseaseCode || '-'}</Descriptions.Item>
        <Descriptions.Item label="姓名">{data.fullName || '-'}</Descriptions.Item>
        <Descriptions.Item label="性别">{data.genderZh || '-'}</Descriptions.Item>
        <Descriptions.Item label="身份证号">{data.nationalId || '-'}</Descriptions.Item>
        <Descriptions.Item label="年龄">{data.age ? `${data.age}岁` : '-'}</Descriptions.Item>
        <Descriptions.Item label="出生日期">
          {data.dob ? (typeof data.dob === 'string' ? formatDate(data.dob) : data.dob.format('YYYY-MM-DD')) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="联系电话">{data.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="报告单位">{data.reportOrgName || '-'}</Descriptions.Item>
        <Descriptions.Item label="报告人员">{data.reportUser || '当前用户'}</Descriptions.Item>
        <Descriptions.Item label="报告日期">{formatDate(data.reportDate)}</Descriptions.Item>
        <Descriptions.Item label="症状开始日期">{formatDate(data.symptomOnsetDate)}</Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>{address}</Descriptions.Item>
      </Descriptions>

      <Descriptions 
        bordered 
        column={1} 
        title="流行病学信息" 
        style={{ marginTop: 24 }}
        labelStyle={{ fontWeight: 'bold', width: '140px' }}
      >
        <Descriptions.Item label="暴露史">
          {data.exposure || <Tag color="default">无</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="接触史">
          {data.contact || <Tag color="default">无</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="旅行史">
          {data.travel || <Tag color="default">无</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions 
        bordered 
        column={2} 
        title="诊断信息" 
        style={{ marginTop: 24 }}
        labelStyle={{ fontWeight: 'bold', width: '140px' }}
      >
        <Descriptions.Item label="初步诊断" span={2}>
          {data.initialDiagnosis || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="确诊诊断" span={2}>
          {data.finalDiagnosis || <Tag color="default">暂无</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="诊断日期">{formatDate(data.diagnosisDate)}</Descriptions.Item>
        <Descriptions.Item label="个案来源">{data.caseSourceName || data.caseSourceCode || '-'}</Descriptions.Item>
        <Descriptions.Item label="个案状态" span={2}>
          {data.caseStatusName || data.caseStatusCode || <Tag color="default">未设置</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
        <Text type="warning">⚠️ 提示：提交前请确保所有信息准确无误。提交后系统将自动生成个案编号。</Text>
      </Space>
    </Card>
  );
}