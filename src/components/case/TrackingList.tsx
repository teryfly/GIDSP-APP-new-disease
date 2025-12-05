import { Button, Card, Descriptions, Empty, List, Space, Tag, Input, message, Modal, App } from 'antd';
import { Link } from 'react-router-dom';
import TrajectoryMap from '../TrajectoryMap';
import { useEffect, useState } from 'react';
import { loadRiskAssessmentOS, buildCodeNameMap, toLabel } from '../../utils/recordOptionsUtils';
import { getEvent, updateEvents } from '../../services/caseDetailsService';
import { PS } from '../../services/contractMapping';
import { buildTrackingUpdateDVs } from '../../services/mappers/eventFormMappers';
import type { TrackingItem } from '../../services/mappers/eventMappers';

// 扩展TrackingItem类型以包含额外的地理编码属性
interface TrackingItemWithGeo extends TrackingItem {
  geocodePending?: boolean;
  geocodeError?: string | null;
}

interface Props {
  caseId: string;
  items: TrackingItemWithGeo[]; // 修改类型为TrackingItemWithGeo
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void;
  onRetryGeocode?: (index: number, addressOverride?: string) => void;
  onRefresh?: () => void; // 添加刷新回调
}

const TrackingList = ({ caseId, items, pager, onLoadMore, onRetryGeocode, onRefresh }: Props) => {
  const { modal, message: messageApi } = App.useApp();
  
  const [riskAssessmentMap, setRiskAssessmentMap] = useState<Map<string, string> | undefined>(undefined);

  useEffect(() => {
    const loadOptionMaps = async () => {
      try {
        // 加载风险评估选项集
        const riskAssessmentOS = await loadRiskAssessmentOS();
        const riskAssessmentMap = buildCodeNameMap(riskAssessmentOS);
        setRiskAssessmentMap(riskAssessmentMap);
      } catch (error) {
        console.error('加载选项集失败:', error);
      }
    };

    loadOptionMaps();
  }, []);

  const canLoadMore = pager.page * pager.pageSize < pager.total;

  // 过滤掉状态为"COMPLETED"的记录，只显示"ACTIVE"的记录
  const activeItems = items.filter(item => item.status !== 'COMPLETED');
  
  const mapRecords = activeItems.map((t) => ({
    id: t.event,
    caseId,
    date: t.occurredAt,
    type: (t.type as any) || '场所暴露史',
    location: t.location || '未知地点',
    lat: typeof t.latitude === 'number' ? t.latitude : undefined,
    lng: typeof t.longitude === 'number' ? t.longitude : undefined,
    description: t.description || '',
    startDate: t.startDate || '',
    endDate: t.endDate || '',
    riskAssessment: (t.riskAssessment as any) || '中风险',
    isPushedToEpi: true,
  }));

  // 删除追踪记录
  const handleDelete = async (item: TrackingItemWithGeo) => {
    modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条追踪记录吗？',
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
          
          const dvs = buildTrackingUpdateDVs({
            trackingType: dataValuesMap.get('DeTrackTp01') as string | undefined,
            startDate: dataValuesMap.get('DeStartDt01') as string | undefined,
            endDate: dataValuesMap.get('DeEndDt0001') as string | undefined,
            regionId: dataValuesMap.get('DeRelRgn001') as string | undefined,
            locationDescription: dataValuesMap.get('DeLocDesc01') as string | undefined,
            contactPersons: dataValuesMap.get('DeContPrsn1') as string | undefined,
            exposureDetails: dataValuesMap.get('DeExpDtl001') as string | undefined,
            riskAssessment: dataValuesMap.get('DeRiskAsmt1') as string | undefined,
            pushedToEpi: dataValuesMap.get('DeTrkPshEpi') === 'true',
            pushEpiDateTime: dataValuesMap.get('DeTrkPshDt1') as string | undefined,
          });

          // 3. 调用更新接口，将status设置为"COMPLETED"
          const res = await updateEvents([
            {
              event: item.event,
              program: 'PrgCaseMgt1',
              programStage: PS.TRACKING,
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
    <>
      <TrajectoryMap records={mapRecords as any} />
      <List
        style={{ marginTop: 16 }}
        dataSource={activeItems}
        loadMore={
          canLoadMore && onLoadMore ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => onLoadMore(pager.page + 1)}>加载更多...</Button>
            </div>
          ) : null
        }
        renderItem={(item, index) => (
          <List.Item>
            <Card style={{ width: '100%' }} title={`📍 ${item.type || '-'} | ${item.occurredAt}`}>
              <Descriptions column={1}>
                <Descriptions.Item label="地点">{item.location || '-'}</Descriptions.Item>
                <Descriptions.Item label="描述">{item.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="起止日期">{item.startDate || '-'} ~ {item.endDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="风险评估">{toLabel(item.riskAssessment, riskAssessmentMap)}</Descriptions.Item>
                <Descriptions.Item label="解析坐标">
                  {typeof item.latitude === 'number' && typeof item.longitude === 'number' ? (
                    <Tag color="green">{item.longitude.toFixed(6)}, {item.latitude.toFixed(6)}</Tag>
                  ) : item.geocodePending ? (
                    <Tag color="blue">解析中...</Tag>
                  ) : item.geocodeError ? (
                    <Tag color="red">{item.geocodeError}</Tag>
                  ) : (
                    <Tag>未解析</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="地址解析">
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      defaultValue={item.location || ''}
                      placeholder="输入用于解析的地址描述（默认使用地点）"
                      onPressEnter={(e) => {
                        if (!onRetryGeocode) return;
                        const addr = (e.currentTarget as HTMLInputElement).value.trim();
                        if (!addr) {
                          message.info('请输入地址后再解析');
                          return;
                        }
                        onRetryGeocode(index, addr);
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={(e) => {
                        if (!onRetryGeocode) return;
                        const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null);
                        let addr = (item.location || '').trim();
                        if (input && input.value.trim()) {
                          addr = input.value.trim();
                        }
                        if (!addr) {
                          message.info('请输入地址后再解析');
                          return;
                        }
                        onRetryGeocode(index, addr);
                      }}
                    >
                      解析地址
                    </Button>
                  </Space.Compact>
                </Descriptions.Item>
              </Descriptions>
              <Space style={{ marginTop: 16, float: 'right' }}>
                <Link to={`/cases/${caseId}/tracking-records/${item.event}/edit`}>编辑</Link>
                <a onClick={() => handleDelete(item)} style={{ color: 'red' }}>删除</a>
              </Space>
            </Card>
          </List.Item>
        )}
        locale={{ emptyText: <Empty description="暂无追踪记录" /> }}
      />
    </>
  );
};

export default TrackingList;