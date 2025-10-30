import { Button, Card, Descriptions, Empty, List, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { TestItem } from '../../services/mappers/eventMappers';

interface Props {
  caseId: string;
  items: TestItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore: (nextPage: number) => void;
}

const TestList = ({ caseId, items, pager, onLoadMore }: Props) => {
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
          <Card style={{ width: '100%' }} title={`🧪 ${item.testType || '-'} | ${item.occurredAt}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="样本类型">{item.sampleType || '-'}</Descriptions.Item>
              <Descriptions.Item label="检测结果"><Tag color={item.result === 'POSITIVE' ? 'red' : 'green'}>{item.result || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="病原体" span={2}>{item.pathogen || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="检测机构" span={2}>{item.lab || '-'}</Descriptions.Item>
              <Descriptions.Item label="检测状态">{item.testStatus || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16, float: 'right' }}>
              <Link to={`/cases/${caseId}/test-records/${item.event}/edit`}>编辑</Link>
            </Space>
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无检测记录" /> }}
    />
  );
};

export default TestList;