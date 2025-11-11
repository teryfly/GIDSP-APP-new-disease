import { Button, Card, Descriptions, Empty, List, Space, Tag, Input, message } from 'antd';
import { Link } from 'react-router-dom';
import TrajectoryMap from '../TrajectoryMap';

interface TrackingItemView {
  event: string;
  occurredAt: string;
  type?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  riskAssessment?: string;
  latitude?: number;
  longitude?: number;
  geocodePending?: boolean;
  geocodeError?: string | null;
}

interface Props {
  caseId: string;
  items: TrackingItemView[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void;
  onRetryGeocode?: (index: number, addressOverride?: string) => void;
}

const TrackingList = ({ caseId, items, pager, onLoadMore, onRetryGeocode }: Props) => {
  const canLoadMore = pager.page * pager.pageSize < pager.total;

  const mapRecords = items.map((t) => ({
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

  return (
    <>
      <TrajectoryMap records={mapRecords as any} />
      <List
        style={{ marginTop: 16 }}
        dataSource={items}
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
                <Descriptions.Item label="风险评估">{item.riskAssessment || '-'}</Descriptions.Item>
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