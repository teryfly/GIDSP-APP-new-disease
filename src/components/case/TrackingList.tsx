import { Button, Card, Descriptions, Empty, List, Space } from 'antd';
import { Link } from 'react-router-dom';
import TrajectoryMap from '../TrajectoryMap';
import type { TrackingItem } from '../../services/mappers/eventMappers';

interface Props {
  caseId: string;
  items: TrackingItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
}

const TrackingList = ({ caseId, items, pager, onLoadMore }: Props) => {
  const canLoadMore = pager.page * pager.pageSize < pager.total;

  const mapRecords = items.map((t) => ({
    id: t.event,
    caseId,
    date: t.occurredAt,
    type: (t.type as any) || '场所暴露史',
    location: t.location || '未知地点',
    lat: t.latitude || 39.9042,
    lng: t.longitude || 116.4074,
    description: t.description || '',
    startDate: t.startDate || '',
    endDate: t.endDate || '',
    riskAssessment: (t.riskAssessment as any) || '中风险',
    isPushedToEpi: true,
  }));

  return (
    <>
      <TrajectoryMap records={mapRecords} />
      <List
        style={{ marginTop: 16 }}
        dataSource={items}
        loadMore={
          canLoadMore && onLoadMore ? ( // 检查onLoadMore是否存在
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => onLoadMore(pager.page + 1)}>加载更多...</Button>
            </div>
          ) : null
        }
        renderItem={(item) => (
          <List.Item>
            <Card style={{ width: '100%' }} title={`📍 ${item.type || '-'} | ${item.occurredAt}`}>
              <Descriptions column={1}>
                <Descriptions.Item label="地点">{item.location || '-'}</Descriptions.Item>
                <Descriptions.Item label="描述">{item.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="起止日期">{item.startDate || '-'} ~ {item.endDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="风险评估">{item.riskAssessment || '-'}</Descriptions.Item>
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