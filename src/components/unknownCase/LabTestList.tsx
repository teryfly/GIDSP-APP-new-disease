import { Table, Button, Space, Tag, Empty } from 'antd';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

interface LabTestRecord {
  event: string;
  occurredAt: string;
  testNo: string;
  testType: string;
  sampleCollectionDate: string;
  testStatus: string;
  testResult?: string;
  confirmedPathogen?: string;
  testOrgName?: string;
  sampleType: string;
  confirmedDiseaseName?: string;
  testDate?: string;
  labReportUrl?: string;
  resultDetails?: string;
}

interface LabTestListProps {
  data: LabTestRecord[];
  caseId: string;
  loading?: boolean;
}

const LabTestList = ({ data, caseId, loading }: LabTestListProps) => {
  const columns: ColumnsType<LabTestRecord> = [
    {
      title: 'Report date',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 120,
    },
    {
      title: '检测编号-2',
      dataIndex: 'testNo',
      key: 'testNo',
      width: 150,
    },
    {
      title: '检测类型-2',
      dataIndex: 'testType',
      key: 'testType',
      width: 120,
    },
    {
      title: '样本采集日期-2',
      dataIndex: 'sampleCollectionDate',
      key: 'sampleCollectionDate',
      width: 140,
    },
    {
      title: '样本类型-2',
      dataIndex: 'sampleType',
      key: 'sampleType',
      width: 120,
    },
    {
      title: '检测状态-2',
      dataIndex: 'testStatus',
      key: 'testStatus',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING_CONFIRMATION: 'gold',
          CONFIRMED: 'green',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '检测结果-2',
      dataIndex: 'testResult',
      key: 'testResult',
      width: 120,
      render: (result?: string) => {
        if (!result) return '-';
        const colorMap: Record<string, string> = {
          POSITIVE: 'red',
          NEGATIVE: 'green',
          PENDING: 'gold',
          UNCERTAIN: 'orange',
        };
        return <Tag color={colorMap[result] || 'default'}>{result}</Tag>;
      },
    },
    {
      title: '确认的病原体',
      dataIndex: 'confirmedPathogen',
      key: 'confirmedPathogen',
      width: 150,
      render: (text?: string) => text || '-',
    },
    {
      title: '确诊疾病名称',
      dataIndex: 'confirmedDiseaseName',
      key: 'confirmedDiseaseName',
      width: 150,
      render: (text?: string) => text || '-',
    },
    {
      title: '检测机构-2',
      dataIndex: 'testOrgName',
      key: 'testOrgName',
      width: 150,
      render: (text?: string) => text || '-',
    },
    {
      title: '检测日期-2',
      dataIndex: 'testDate',
      key: 'testDate',
      width: 120,
      render: (text?: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Link to={`/unknown-cases/${caseId}/lab-tests/${record.event}/edit`}>编辑</Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="event"
      loading={loading}
      pagination={false}
      scroll={{ x: 1600 }}
      locale={{ emptyText: <Empty description="暂无检测记录" /> }}
    />
  );
};

export default LabTestList;