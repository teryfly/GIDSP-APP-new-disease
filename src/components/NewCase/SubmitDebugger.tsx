import { Drawer, Descriptions, Table, Tag, Typography } from 'antd';

const { Paragraph, Text } = Typography;

interface ObjectReport {
  uid?: string;
  index?: number;
  errorReports?: Array<{ message: string; errorCode?: string; trackerType?: string; uid?: string }>;
}
interface TypeReport {
  stats?: { created: number; updated: number; deleted: number; ignored: number; total: number };
  objectReports?: ObjectReport[];
}
interface Props {
  open: boolean;
  onClose: () => void;
  lastRequest?: any;
  lastResponse?: any;
  title?: string;
}

export default function SubmitDebugger({ open, onClose, lastRequest, lastResponse, title }: Props) {
  const trk = lastResponse?.bundleReport?.typeReportMap?.TRACKED_ENTITY as TypeReport | undefined;
  const enr = lastResponse?.bundleReport?.typeReportMap?.ENROLLMENT as TypeReport | undefined;
  const evt = lastResponse?.bundleReport?.typeReportMap?.EVENT as TypeReport | undefined;

  const colorByCode = (code?: string) => {
    if (!code) return 'red';
    if (code === 'E1064') return 'magenta'; // 非唯一
    if (code === 'E1018') return 'volcano'; // 必填缺失
    if (code === 'E5000') return 'orange';  // 依赖失败
    return 'red';
  };

  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid', render: (v: string) => v || '-' },
    { title: 'Index', dataIndex: 'index', key: 'index', render: (v: number) => (v ?? '-') },
    {
      title: '错误',
      dataIndex: 'errorReports',
      key: 'errorReports',
      render: (errs: any[]) =>
        (errs || []).length ? (
          <div>
            {errs.map((er, idx) => (
              <Paragraph key={idx} style={{ marginBottom: 4 }}>
                <Tag color={colorByCode(er.errorCode)}>{er.errorCode || 'ERROR'}</Tag>
                <Text>{er.message}</Text>
                {er.uid ? <Tag>uid:{er.uid}</Tag> : null}
              </Paragraph>
            ))}
          </div>
        ) : (
          <Tag color="green">OK</Tag>
        ),
    },
  ];

  const renderType = (label: string, tr?: TypeReport) =>
    tr ? (
      <>
        <Descriptions title={label} bordered size="small" column={5} style={{ marginTop: 12 }}>
          <Descriptions.Item label="created">{tr.stats?.created ?? 0}</Descriptions.Item>
          <Descriptions.Item label="updated">{tr.stats?.updated ?? 0}</Descriptions.Item>
          <Descriptions.Item label="deleted">{tr.stats?.deleted ?? 0}</Descriptions.Item>
          <Descriptions.Item label="ignored">{tr.stats?.ignored ?? 0}</Descriptions.Item>
          <Descriptions.Item label="total">{tr.stats?.total ?? 0}</Descriptions.Item>
        </Descriptions>
        <Table size="small" style={{ marginTop: 8 }} columns={columns as any} dataSource={(tr.objectReports || []).map((r, i) => ({ key: i, ...r }))} pagination={false} />
      </>
    ) : null;

  return (
    <Drawer width={720} open={open} onClose={onClose} title={title || '提交调试信息'}>
      <Descriptions title="Import Summary" bordered size="small" column={2}>
        <Descriptions.Item label="httpStatus">{lastResponse?.httpStatus || '-'}</Descriptions.Item>
        <Descriptions.Item label="status">{lastResponse?.status || '-'}</Descriptions.Item>
      </Descriptions>
      {renderType('TRACKED_ENTITY', trk)}
      {renderType('ENROLLMENT', enr)}
      {renderType('EVENT', evt)}
      <Descriptions title="Request Payload" bordered size="small" column={1} style={{ marginTop: 16 }}>
        <Descriptions.Item label="payload">
          <Paragraph style={{ maxHeight: 200, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(lastRequest, null, 2)}</pre>
          </Paragraph>
        </Descriptions.Item>
      </Descriptions>
      <Descriptions title="Raw Response" bordered size="small" column={1} style={{ marginTop: 16 }}>
        <Descriptions.Item label="response">
          <Paragraph style={{ maxHeight: 200, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(lastResponse, null, 2)}</pre>
          </Paragraph>
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
}