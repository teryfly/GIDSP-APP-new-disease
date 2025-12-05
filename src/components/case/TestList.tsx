import { Button, Card, Descriptions, Empty, List, Space, Tag, Modal, message, App } from 'antd';
import { Link } from 'react-router-dom';
import type { TestItem } from '../../services/mappers/eventMappers';
import { useEffect, useState } from 'react';
import { loadSampleTypeOS, loadTestResultOS, loadTestStatusOS, buildCodeNameMap, toLabel } from '../../utils/recordOptionsUtils';
import { getEvent, updateEvents } from '../../services/caseDetailsService';
import { PS } from '../../services/contractMapping';
import { buildTestUpdateDVs } from '../../services/mappers/eventFormMappers';

interface Props {
  caseId: string;
  items: TestItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
  onRefresh?: () => void; // 添加刷新回调
}

const TestList = ({ caseId, items, pager, onLoadMore, onRefresh }: Props) => {
  const { modal, message: messageApi } = App.useApp();
  
  const [sampleTypeMap, setSampleTypeMap] = useState<Map<string, string> | undefined>(undefined);
  const [testResultMap, setTestResultMap] = useState<Map<string, string> | undefined>(undefined);
  const [testStatusMap, setTestStatusMap] = useState<Map<string, string> | undefined>(undefined);

  useEffect(() => {
    const loadOptionMaps = async () => {
      try {
        // 加载样本类型选项集
        const sampleTypeOS = await loadSampleTypeOS();
        const sampleTypeMap = buildCodeNameMap(sampleTypeOS);
        setSampleTypeMap(sampleTypeMap);

        // 加载检测结果选项集
        const testResultOS = await loadTestResultOS();
        const testResultMap = buildCodeNameMap(testResultOS);
        setTestResultMap(testResultMap);

        // 加载检测状态选项集
        const testStatusOS = await loadTestStatusOS();
        const testStatusMap = buildCodeNameMap(testStatusOS);
        setTestStatusMap(testStatusMap);
      } catch (error) {
        console.error('加载选项集失败:', error);
      }
    };

    loadOptionMaps();
  }, []);

  const canLoadMore = pager.page * pager.pageSize < pager.total;

  const resultColor = (r?: string) => {
    if (!r) return 'default';
    const v = r.toUpperCase();
    if (v === 'POSITIVE' || v === '阳性') return 'red';
    if (v === 'NEGATIVE' || v === '阴性') return 'green';
    if (v === 'PENDING' || v === '待定') return 'gold';
    if (v === 'UNCERTAIN' || v === '不确定') return 'orange';
    return 'default';
  };

  // 过滤掉状态为"COMPLETED"的记录，只显示"ACTIVE"的记录
  const activeItems = items.filter(item => item.status !== 'COMPLETED');

  // 删除检测记录
  const handleDelete = async (item: TestItem) => {
    modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条检测记录吗？',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 1. 调用详情查询接口
          const eventDetails = await getEvent(item.event);
          
          // 2. 构造更新数据，将status设置为"COMPLETED"
          // 提取所有字段值，确保即使字段不存在也不会出错
          const dataValuesMap = new Map((eventDetails.dataValues || []).map((dv: any) => [dv.dataElement, dv.value]));
          
          const dvs = buildTestUpdateDVs({
            testNo: dataValuesMap.get('DeTestNo001') as string | undefined,
            sampleCollectionDate: dataValuesMap.get('DeSmplColDt') as string | undefined,
            sampleType: dataValuesMap.get('DeSmplType1') as string | undefined,
            testType: dataValuesMap.get('DeTestType1') as string | undefined,
            testOrgName: dataValuesMap.get('DeTestOrg01') as string | undefined,
            testDate: dataValuesMap.get('DeTestDt001') as string | undefined,
            testResult: dataValuesMap.get('DeTestRslt1') as string | undefined,
            pathogenDetected: dataValuesMap.get('DePathogen1') as string | undefined,
            resultDetails: dataValuesMap.get('DeRsltDtl01') as string | undefined,
            testStatus: dataValuesMap.get('DeTestStat1') as string | undefined,
            pushLab: dataValuesMap.get('DePushLab01') === 'true',
            pushLabDateTime: dataValuesMap.get('DePushLabDt') as string | undefined,
            labReportUrl: dataValuesMap.get('DeLabRptUrl') as string | undefined,
          });

          // 3. 调用更新接口，将status设置为"COMPLETED"
          const res = await updateEvents([
            {
              event: item.event,
              program: 'PrgCaseMgt1',
              programStage: PS.TEST,
              enrollment: eventDetails.enrollment,
              orgUnit: eventDetails.orgUnit,
              status: 'COMPLETED',
              occurredAt: eventDetails.occurredAt,
              dataValues: dvs,
            },
          ]);

          if (res.status === 'OK') {
            messageApi.success('删除成功');
            // 刷新列表
            setTimeout(() => {
              if (onRefresh) {
                onRefresh();
              }
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

  return (
    <List
      dataSource={activeItems}
      loadMore={
        canLoadMore && onLoadMore ? ( // 检查onLoadMore是否存在
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => onLoadMore(pager.page + 1)}>加载更多...</Button>
          </div>
        ) : null
      }
      renderItem={(item) => (
        <List.Item>
          <Card style={{ width: '100%' }} title={`🧪 ${item.testType || '-'} | ${item.occurredAt}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="样本类型">{toLabel(item.sampleType, sampleTypeMap)}</Descriptions.Item>
              <Descriptions.Item label="检测结果">
                <Tag color={resultColor(item.result)}>{toLabel(item.result, testResultMap)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="病原体" span={2}>{item.pathogen || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="检测机构" span={2}>{item.lab || '-'}</Descriptions.Item>
              <Descriptions.Item label="检测状态">{toLabel(item.testStatus, testStatusMap)}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/test-records/${item.event}/edit`}>编辑</Link>
              <a onClick={() => handleDelete(item)} style={{ color: 'red' }}>删除</a>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无检测记录" /> }}
    />
  );
};

export default TestList;