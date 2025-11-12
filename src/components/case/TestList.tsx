import { Button, Card, Descriptions, Empty, List, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { TestItem } from '../../services/mappers/eventMappers';

interface Props {
  caseId: string;
  items: TestItem[];
  pager: { page: number; pageSize: number; total: number };
  onLoadMore?: (nextPage: number) => void; // 使onLoadMore变为可选
}

const TestList = ({ caseId, items, pager, onLoadMore }: Props) => {
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
          <Card style={{ width: '100%' }} title={`🧪 ${item.testType || '-'} | ${item.occurredAt}`}>
            <Descriptions column={2}>
              <Descriptions.Item label="样本类型">{item.sampleType || '-'}</Descriptions.Item>
              <Descriptions.Item label="检测结果">
                <Tag color={resultColor(item.result)}>{item.result || '-'}</Tag>
              </Descriptions.Item>
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