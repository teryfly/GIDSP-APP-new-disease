import { Button, Card, Descriptions, Empty, List, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { FollowUpItem } from '../../services/mappers/eventMappers';

interface Props {
  caseId: string;
  items: FollowUpItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore: (nextPage: number) => void;
}

const FollowUpList = ({ caseId, items, pager, onLoadMore }: Props) => {
  const canLoadMore = pager.page * pager.pageSize < pager.total;

  return (
    <List
      dataSource={items}
      loadMore={
        canLoadMore ? (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => onLoadMore(pager.page + 1)}>加载更多...</Button>
          </div>
        ) : null
      }
      renderItem={(item) => (
        <List.Item>
          <Card style={{ width: '100%' }} title={`📅 ${item.occurredAt} | ${item.method || '-'} | ${item.doctor || '-'}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="健康状态">
                <Tag color={item.healthStatus === 'ABNORMAL' || item.healthStatus === '恶化' ? 'red' : 'green'}>
                  {item.healthStatus || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="体温">{item.temperature || '-'}</Descriptions.Item>
              <Descriptions.Item label="症状" span={2}>{item.symptoms || '-'}</Descriptions.Item>
              <Descriptions.Item label="治疗依从性">{item.treatmentCompliance || '-'}</Descriptions.Item>
              <Descriptions.Item label="下次随访">{item.nextFollowUpDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{item.notes || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/follow-ups/${item.event}/edit`}>编辑</Link>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无随访记录" /> }}
    />
  );
};

export default FollowUpList;