import { Empty, List, Tag, Typography } from 'antd';

interface ChangeLog {
  createdBy: { uid: string; username: string };
  createdAt: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  change: any;
}
interface Props {
  teiLogs: ChangeLog[];
  eventLogs: ChangeLog[];
}

const typeColor = (t: string) => (t === 'UPDATE' ? 'blue' : t === 'CREATE' ? 'green' : 'red');

const OperationLogs = ({ teiLogs, eventLogs }: Props) => {
  const data = [
    ...(teiLogs || []).map((l) => ({ ...l, scope: 'TEI' })),
    ...(eventLogs || []).map((l) => ({ ...l, scope: 'EVENT' })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (!data.length) return <Empty description="暂无操作日志" />;

  return (
    <List
      dataSource={data}
      renderItem={(item: any) => (
        <List.Item>
          <List.Item.Meta
            title={
              <>
                <Tag>{item.scope}</Tag>
                <Tag color={typeColor(item.type)}>{item.type}</Tag>
                <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{item.createdAt}</Typography.Text>
              </>
            }
            description={
              <>
                <div>By: {item.createdBy?.username || '-'}</div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(item.change, null, 2)}</pre>
              </>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default OperationLogs;