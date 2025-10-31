import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Table, Tag, Typography, Tooltip, message } from 'antd';
import { Link } from 'react-router-dom';
import OrgUnitSelect from '../components/common/OrgUnitSelect';
import dayjs from 'dayjs';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  PROGRAM_UNKNOWN_ID,
  OS_UNK_STATUS_ID,
  getMe,
  getOptionSet,
  queryUnknownCases,
  fetchLatestLabByEnrollment,
  exportUnknownCasesCsv,
  type OptionSet,
} from '../services/unknownCaseService';
import { mapTEIsToUnknownRows, enrichWithLabEvent, type UnknownCaseRow } from '../services/mappers/unknownCaseMappers';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const statusTagColor = (code?: string) => {
  if (!code) return 'default';
  const up = code.toUpperCase();
  if (['PENDING', 'PEND', 'WAIT', 'TO_BE_TESTED'].includes(up)) return 'gold'; // 待检测
  if (['TESTING', 'IN_PROGRESS'].includes(up)) return 'blue'; // 检测中
  if (['CONFIRMED'].includes(up)) return 'green'; // 已确诊
  if (['EXCLUDED', 'DISCARDED'].includes(up)) return 'default'; // 已排除
  return 'default';
};
const urgencyTagColor = (u?: UnknownCaseRow['urgency']) => (u === '高' ? 'red' : u === '低' ? 'green' : 'orange');

export default function UnknownCaseList() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [statusOS, setStatusOS] = useState<OptionSet | null>(null);
  const [meOrgUnitId, setMeOrgUnitId] = useState<string | undefined>(undefined);

  const [data, setData] = useState<UnknownCaseRow[]>([]);
  const [pager, setPager] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 50, total: 0 });
  const [order, setOrder] = useState<'createdAt:asc' | 'createdAt:desc'>('createdAt:desc');

  // filters
  const caseNoLike = Form.useWatch('caseNoLike', form);
  const patientNameLike = Form.useWatch('patientNameLike', form);
  const dateRange = Form.useWatch('dateRange', form);
  const orgUnitId = Form.useWatch('orgUnitId', form);
  const statusCodeEq = Form.useWatch('statusCodeEq', form); // Stored in stage; API-04 doesn't filter by it.

  const debouncedCaseNo = useDebouncedValue(caseNoLike, 400);
  const debouncedName = useDebouncedValue(patientNameLike, 400);

  // init metadata
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [os, me] = await Promise.all([getOptionSet(OS_UNK_STATUS_ID), getMe()]);
        setStatusOS(os);
        setMeOrgUnitId(me.organisationUnits?.[0]?.id);
        form.setFieldsValue({ orgUnitId: me.organisationUnits?.[0]?.id });
      } catch (e: any) {
        message.error(`加载元数据失败: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusCodeMap = useMemo(() => {
    const m = new Map<string, string>();
    (statusOS?.options || []).forEach((o) => m.set(o.code, o.name));
    return m;
  }, [statusOS]);

  const fetchData = useRef<(p?: number, ps?: number) => Promise<void>>(async () => {});

  fetchData.current = async (page = pager.page, pageSize = pager.pageSize) => {
    if (!orgUnitId && !meOrgUnitId) return;
    const enrolledAfter = dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined;
    const enrolledBefore = dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined;

    try {
      setLoading(true);
      const res = await queryUnknownCases({
        ouId: orgUnitId || meOrgUnitId!,
        page,
        pageSize,
        order,
        caseNoLike: debouncedCaseNo,
        patientNameLike: debouncedName,
        enrolledAfter,
        enrolledBefore,
        statusCodeEq, // ignored by API as status lives in stage DE; kept for future compatibility
      });
      const rows: UnknownCaseRow[] = res.trackedEntities.map((tei) => mapTEIsToUnknownRows(tei, statusCodeMap));
      setData(rows);
      setPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total });

      // lazy load latest lab event per row (visible page)
      await Promise.all(
        rows.map(async (r) => {
          if (!r.enrollment) return;
          try {
            const ev = await fetchLatestLabByEnrollment(r.enrollment);
            const evt = ev.events?.[0];
            const enriched = enrichWithLabEvent({ ...r }, evt, statusCodeMap);
            setData((prev) => {
              const copy = prev.slice();
              const i = copy.findIndex((x) => x.key === r.key);
              if (i >= 0) copy[i] = enriched;
              return copy;
            });
          } catch {
            // ignore per-row error
          }
        }),
      );
    } catch (e: any) {
      message.error(`查询失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // auto search
  useEffect(() => {
    if (!meOrgUnitId) return;
    fetchData.current(1, pager.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCaseNo, debouncedName, dateRange, orgUnitId, order, statusCodeEq, meOrgUnitId]);

  const columns = useMemo(() => {
    return [
      {
        title: '病例编号',
        dataIndex: 'caseNo',
        key: 'caseNo',
        render: (text: string, record: UnknownCaseRow) => (
          <Tooltip title={text}>
            <Link to={`/unknown-cases/${record.trackedEntity}`}>{text || '-'}</Link>
          </Tooltip>
        ),
      },
      {
        title: '患者',
        dataIndex: 'patientName',
        key: 'patientName',
        render: (text: string) => <Tooltip title={text}>{text || '-'}</Tooltip>,
      },
      {
        title: '报告日期',
        dataIndex: 'reportDate',
        key: 'reportDate',
        render: (text: string) => text || '-',
        sorter: true,
      },
      {
        title: '病例状态',
        dataIndex: 'statusName',
        key: 'statusName',
        render: (_: any, record: UnknownCaseRow) => (
          <Tag color={statusTagColor(record.statusCode)}>{record.statusName || '-'}</Tag>
        ),
      },
      {
        title: '紧急度',
        dataIndex: 'urgency',
        key: 'urgency',
        render: (u: UnknownCaseRow['urgency']) => <Tag color={urgencyTagColor(u)}>{u || '中'}</Tag>,
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        render: (_: any, record: UnknownCaseRow) => {
          const code = (record.statusCode || '').toUpperCase();
          const isConfirmed = code === 'CONFIRMED';
          const isExcluded = code === 'EXCLUDED' || code === 'DISCARDED';
          const isPendingOrTesting = !isConfirmed && !isExcluded;
          return (
            <Space size="middle">
              <Link to={`/unknown-cases/${record.trackedEntity}`}>查看</Link>
              {isPendingOrTesting && <Link to={`/unknown-cases/${record.trackedEntity}/edit`}>编辑</Link>}
              {isPendingOrTesting && <a>上报</a>}
              {isConfirmed && <a>推送</a>}
            </Space>
          );
        },
      },
    ];
  }, []);

  const onTableChange = (pagination: any, _filters: any, sorter: any) => {
    const { current = 1, pageSize = pager.pageSize } = pagination;
    if (sorter?.field === 'reportDate') {
      setOrder(sorter.order === 'ascend' ? 'createdAt:asc' : 'createdAt:desc');
    }
    fetchData.current(current, pageSize);
  };

  const handleExport = async () => {
    try {
      const enrolledAfter = dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined;
      const enrolledBefore = dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined;
      const blob = await exportUnknownCasesCsv({
        ouId: orgUnitId || meOrgUnitId!,
        caseNoLike: debouncedCaseNo,
        patientNameLike: debouncedName,
        enrolledAfter,
        enrolledBefore,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unknown-cases-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      message.error(`导出失败: ${e.message}`);
    }
  };

  const resetFilters = () => {
    form.resetFields();
    form.setFieldsValue({ orgUnitId: meOrgUnitId });
    fetchData.current(1, pager.pageSize);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="病例编号" name="caseNoLike">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="患者姓名" name="patientNameLike">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="报告日期" name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="病例状态" name="statusCodeEq">
                <Select
                  allowClear
                  placeholder="全部"
                  options={(statusOS?.options || []).map((o) => ({ value: o.code, label: o.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="报告单位" name="orgUnitId">
                <OrgUnitSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" onClick={() => fetchData.current(1, pager.pageSize)}>查询</Button>
                <Button onClick={resetFilters}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary">
                <Link to="/unknown-cases/new">新增病例</Link>
              </Button>
              <Button onClick={handleExport}>导出Excel</Button>
            </Space>
          </Col>
          <Col>
            <Text>共 {pager.total} 条</Text>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns as any}
          dataSource={data}
          rowKey="key"
          loading={loading}
          pagination={{
            current: pager.page,
            pageSize: pager.pageSize,
            total: pager.total,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => fetchData.current(page, pageSize),
          }}
          onChange={onTableChange}
          scroll={{ x: 900 }}
          rowClassName={(record: UnknownCaseRow) => (record.urgency === '高' ? 'row-urgent-high' : '')}
        />
        <style>
          {`.row-urgent-high td { background-color: rgba(255,0,0,0.06); }`}
        </style>
      </Card>
    </Space>
  );
}