import { Button, Card, Descriptions, Empty, List, Space, Tag, Modal, message, App } from 'antd';
import { Link } from 'react-router-dom';
import type { FollowUpItem } from '../../services/mappers/eventMappers';
import { useEffect, useState } from 'react';
import { loadHealthStatusOS, loadTreatmentComplianceOS, buildCodeNameMap, toLabel } from '../../utils/recordOptionsUtils';
import { getEvent, updateEvents } from '../../services/caseDetailsService';
import { PS } from '../../services/contractMapping';
import { buildFollowUpUpdateDVs } from '../../services/mappers/eventFormMappers';

interface Props {
  caseId: string;
  items: FollowUpItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
  onRefresh?: () => void; // 添加刷新回调
}

const FollowUpList = ({ caseId, items, pager, onLoadMore, onRefresh }: Props) => {
  const { modal, message: messageApi } = App.useApp();
  
  const [healthStatusMap, setHealthStatusMap] = useState<Map<string, string> | undefined>(undefined);
  const [treatmentComplianceMap, setTreatmentComplianceMap] = useState<Map<string, string> | undefined>(undefined);

  useEffect(() => {
    const loadOptionMaps = async () => {
      try {
        // 加载健康状态选项集
        const healthStatusOS = await loadHealthStatusOS();
        const healthStatusMap = buildCodeNameMap(healthStatusOS);
        setHealthStatusMap(healthStatusMap);

        // 加载治疗依从性选项集
        const treatmentComplianceOS = await loadTreatmentComplianceOS();
        const treatmentComplianceMap = buildCodeNameMap(treatmentComplianceOS);
        setTreatmentComplianceMap(treatmentComplianceMap);
      } catch (error) {
        console.error('加载选项集失败:', error);
      }
    };

    loadOptionMaps();
  }, []);

  const canLoadMore = pager.page * pager.pageSize < pager.total;

  // 健康状态颜色映射
  const healthStatusColor = (status?: string) => {
    if (!status) return 'default';
    if (status === '好转' || status === '稳定') return 'green';
    if (status === '异常' || status === '恶化') return 'red';
    return 'default';
  };

  // 过滤掉状态为"COMPLETED"的记录，只显示"ACTIVE"的记录
  const activeItems = items.filter(item => item.status !== 'COMPLETED');

  // 删除随访记录
  const handleDelete = async (item: FollowUpItem) => {
    modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条随访记录吗？',
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
          
          const dvs = buildFollowUpUpdateDVs({
            followUpMethod: dataValuesMap.get('DeFlwUpMthd') as string | undefined,
            healthStatus: dataValuesMap.get('DeHlthStat1') as string | undefined,
            treatmentCompliance: dataValuesMap.get('DeTrtCompl1') as string | undefined,
            temperature: dataValuesMap.get('DeTemp00001') ? Number(dataValuesMap.get('DeTemp00001')) : null,
            symptoms: dataValuesMap.get('DeSymptoms1') as string | undefined,
            nextFollowUpDate: dataValuesMap.get('DeNxtFlwDt1') as string | undefined,
            remarks: dataValuesMap.get('DeRemarks01') as string | undefined,
          });

          // 3. 调用更新接口，将status设置为"COMPLETED"
          const res = await updateEvents([
            {
              event: item.event,
              program: 'PrgCaseMgt1',
              programStage: PS.FOLLOW_UP,
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
          <Card style={{ width: '100%' }} title={`📅 ${item.occurredAt} | ${item.method || '-'}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="健康状态">
                <Tag color={healthStatusColor(item.healthStatus)}>
                  {toLabel(item.healthStatus, healthStatusMap)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="体温">{item.temperature || '-'}</Descriptions.Item>
              <Descriptions.Item label="症状" span={2}>{item.symptoms || '-'}</Descriptions.Item>
              <Descriptions.Item label="治疗依从性">
                {toLabel(item.treatmentCompliance, treatmentComplianceMap)}
              </Descriptions.Item>
              <Descriptions.Item label="下次随访">{item.nextFollowUpDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{item.notes || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/follow-ups/${item.event}/edit`}>编辑</Link>
              <a onClick={() => handleDelete(item)} style={{ color: 'red' }}>删除</a>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无随访记录" /> }}
    />
  );
};

export default FollowUpList;