import { Table, Button, Space, Tag, Empty, App } from 'antd';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { loadSampleTypeOS, loadTestResultOS, loadTestStatusOS, loadTestTypeOS, loadPathogenOS, buildCodeNameMap, toLabel } from '../../utils/recordOptionsUtils';
import { getLabTestEventDetail, updateLabTestEvent } from '../../services/unknownCase/labTest';

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
  const { modal, message: messageApi } = App.useApp();
  const [sampleTypeMap, setSampleTypeMap] = useState<Map<string, string> | undefined>(undefined);
  const [testResultMap, setTestResultMap] = useState<Map<string, string> | undefined>(undefined);
  const [testStatusMap, setTestStatusMap] = useState<Map<string, string> | undefined>(undefined);
  const [testTypeMap, setTestTypeMap] = useState<Map<string, string> | undefined>(undefined);
  const [pathogenMap, setPathogenMap] = useState<Map<string, string> | undefined>(undefined);

  useEffect(() => {
    const loadOptionMaps = async () => {
      try {
        // 加载选项集
        const [sampleTypeOS, testResultOS, testStatusOS, testTypeOS, pathogenOS] = await Promise.all([
          loadSampleTypeOS(),
          loadTestResultOS(),
          loadTestStatusOS(),
          loadTestTypeOS(), // 检测类型选项集
          loadPathogenOS()  // 病原体选项集
        ]);
        
        // 构建代码到名称的映射
        const sampleTypeMap = buildCodeNameMap(sampleTypeOS);
        const testResultMap = buildCodeNameMap(testResultOS);
        const testStatusMap = buildCodeNameMap(testStatusOS);
        const testTypeMap = buildCodeNameMap(testTypeOS);
        const pathogenMap = buildCodeNameMap(pathogenOS);
        
        setSampleTypeMap(sampleTypeMap);
        setTestResultMap(testResultMap);
        setTestStatusMap(testStatusMap);
        setTestTypeMap(testTypeMap);
        setPathogenMap(pathogenMap);
      } catch (error) {
        console.error('加载选项集失败:', error);
      }
    };

    loadOptionMaps();
  }, []);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    // 将 YYYY-MM-DDTHH:mm:ss.SSS 格式转换为 YYYY-MM-DD
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  // 删除检测记录
  const handleDelete = async (record: LabTestRecord) => {
    modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条检测记录吗？',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 1. 调用详情查询接口
          const eventDetails = await getLabTestEventDetail(record.event);
          
          // 2. 构造更新数据，将status设置为"COMPLETED"
          // 提取所有字段值，确保即使字段不存在也不会出错
          const dataValuesMap = new Map((eventDetails.dataValues || []).map((dv: any) => [dv.dataElement, dv.value]));
          
          const payload = {
            event: record.event,
            enrollment: eventDetails.enrollment,
            trackedEntity: eventDetails.trackedEntity,
            orgUnit: eventDetails.orgUnit,
            occurredAt: eventDetails.occurredAt,
            scheduledAt: eventDetails.scheduledAt,
            testType: dataValuesMap.get('DeUnkTstTp1') || '',
            sampleCollectionDate: dataValuesMap.get('DeUnkSmplDt') || '',
            testStatus: dataValuesMap.get('DeUnkTstSt1') || '',
            confirmedDiseaseName: dataValuesMap.get('DeConfDis01') || '',
            testDate: dataValuesMap.get('DeUnkTstDt1') || '',
            testResult: dataValuesMap.get('DeUnkTstRst') || '',
            testNo: dataValuesMap.get('DeUnkTstNo1') || '',
            labReportUrl: dataValuesMap.get('DeUnkLabUrl') || '',
            testOrgName: dataValuesMap.get('DeUnkTstOrg') || '',
            confirmedPathogen: dataValuesMap.get('DeConfPath1') || '',
            sampleType: dataValuesMap.get('DeUnkSmplTp') || '',
            resultDetails: dataValuesMap.get('DeUnkRstDtl') || '',
            completeEvent: true, // 设置为COMPLETED状态实现软删除
            ...(eventDetails.assignedUser && { assignedUser: eventDetails.assignedUser }),
          };

          // 3. 调用更新接口，将status设置为"COMPLETED"
          const res = await updateLabTestEvent(payload);

          if (res.status === 'OK' || res.status === 'SUCCESS') {
            messageApi.success('删除成功');
            // 刷新页面或重新加载数据
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            messageApi.error('删除失败，请重试');
          }
        } catch (e: any) {
          messageApi.error(`删除失败: ${e.message}`);
        }
      },
    });
  };

  const columns: ColumnsType<LabTestRecord> = [
    {
      title: 'Report date',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 120,
      render: (date: string) => formatDate(date),
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
      render: (testType: string) => toLabel(testType, testTypeMap),
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
      render: (sampleType: string) => toLabel(sampleType, sampleTypeMap),
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
        return <Tag color={colorMap[status] || 'default'}>{toLabel(status, testStatusMap)}</Tag>;
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
        return <Tag color={colorMap[result] || 'default'}>{toLabel(result, testResultMap)}</Tag>;
      },
    },
    {
      title: '确认的病原体',
      dataIndex: 'confirmedPathogen',
      key: 'confirmedPathogen',
      width: 150,
      render: (pathogen?: string) => toLabel(pathogen, pathogenMap) || pathogen || '-',
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
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Link to={`/unknown-cases/${caseId}/lab-tests/${record.event}/edit`}>编辑</Link>
          <a onClick={() => handleDelete(record)} style={{ color: 'red' }}>删除</a>
        </Space>
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