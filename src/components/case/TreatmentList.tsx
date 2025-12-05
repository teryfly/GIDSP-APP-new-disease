import { Button, Card, Descriptions, Empty, List, Space, Tag, Modal, message, App } from 'antd';
import { Link } from 'react-router-dom';
import type { TreatmentItem } from '../../services/mappers/eventMappers';
import { useEffect, useState } from 'react';
import { loadTreatmentTypeOS, loadTreatmentOutcomeOS, buildCodeNameMap, toLabel } from '../../utils/recordOptionsUtils';
import { getEvent, updateEvents } from '../../services/caseDetailsService';
import { PS } from '../../services/contractMapping';
import { buildTreatmentUpdateDVs } from '../../services/mappers/eventFormMappers';

interface Props {
  caseId: string;
  items: TreatmentItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
  onRefresh?: () => void; // 添加刷新回调
}

const TreatmentList = ({ caseId, items, pager, onLoadMore, onRefresh }: Props) => {
  const { modal, message: messageApi } = App.useApp();
  
  const [treatmentTypeMap, setTreatmentTypeMap] = useState<Map<string, string> | undefined>(undefined);
  const [treatmentOutcomeMap, setTreatmentOutcomeMap] = useState<Map<string, string> | undefined>(undefined);

  useEffect(() => {
    const loadOptionMaps = async () => {
      try {
        // 加载治疗类型选项集
        const treatmentTypeOS = await loadTreatmentTypeOS();
        const treatmentTypeMap = buildCodeNameMap(treatmentTypeOS);
        setTreatmentTypeMap(treatmentTypeMap);

        // 加载治疗结果选项集
        const treatmentOutcomeOS = await loadTreatmentOutcomeOS();
        const treatmentOutcomeMap = buildCodeNameMap(treatmentOutcomeOS);
        setTreatmentOutcomeMap(treatmentOutcomeMap);
      } catch (error) {
        console.error('加载选项集失败:', error);
      }
    };

    loadOptionMaps();
  }, []);

  const canLoadMore = pager.page * pager.pageSize < pager.total;

  // 过滤掉状态为"COMPLETED"的记录，只显示"ACTIVE"的记录
  const activeItems = items.filter(item => item.status !== 'COMPLETED');

  // 删除治疗记录
  const handleDelete = async (item: TreatmentItem) => {
    modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条治疗记录吗？',
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
          
          const dvs = buildTreatmentUpdateDVs({
            treatmentType: dataValuesMap.get('DeTrtType01') as string | undefined,
            hospitalName: dataValuesMap.get('DeHospNm001') as string | undefined,
            departmentName: dataValuesMap.get('DeDeptNm001') as string | undefined,
            doctorName: dataValuesMap.get('DeDocNm0001') as string | undefined,
            diagnosis: dataValuesMap.get('DeDiagnos01') as string | undefined,
            treatmentPlan: dataValuesMap.get('DeTrtPlan01') as string | undefined,
            medications: dataValuesMap.get('DeMedicat01') as string | undefined,
            treatmentOutcome: dataValuesMap.get('DeTrtOutcm1') as string | undefined,
            dischargeDate: dataValuesMap.get('DeDiscDt001') as string | undefined,
          });

          // 3. 调用更新接口，将status设置为"COMPLETED"
          const res = await updateEvents([
            {
              event: item.event,
              program: 'PrgCaseMgt1',
              programStage: PS.TREATMENT,
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
          <Card style={{ width: '100%' }} title={`🏥 ${item.hospital || '-'} | ${item.occurredAt}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="治疗类型">
                <Tag>{toLabel(item.type, treatmentTypeMap)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="治疗结果">
                <Tag>{toLabel(item.outcome, treatmentOutcomeMap)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="诊断" span={2}>{item.diagnosis || '-'}</Descriptions.Item>
              <Descriptions.Item label="治疗方案" span={2}>{item.plan || '-'}</Descriptions.Item>
              <Descriptions.Item label="出院日期">{item.dischargeDate || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/treatments/${item.event}/edit`}>编辑</Link>
              <a onClick={() => handleDelete(item)} style={{ color: 'red' }}>删除</a>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无治疗记录" /> }}
    />
  );
};

export default TreatmentList;