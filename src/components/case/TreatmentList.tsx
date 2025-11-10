import { Button, Card, Descriptions, Empty, List, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { TreatmentItem } from '../../services/mappers/eventMappers';

interface Props {
  caseId: string;
  items: TreatmentItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
}

const TreatmentList = ({ caseId, items, pager, onLoadMore }: Props) => {
  const canLoadMore = pager.page * pager.pageSize < pager.total;

  return (
    <List
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
          <Card style={{ width: '100%' }} title={`🏥 ${item.hospital || '-'} | ${item.occurredAt}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="治疗类型"><Tag>{item.type || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="治疗结果"><Tag>{item.outcome || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="诊断" span={2}>{item.diagnosis || '-'}</Descriptions.Item>
              <Descriptions.Item label="治疗方案" span={2}>{item.plan || '-'}</Descriptions.Item>
              <Descriptions.Item label="出院日期">{item.dischargeDate || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/treatments/${item.event}/edit`}>编辑</Link>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无治疗记录" /> }}
    />
  );
};

export default TreatmentList;