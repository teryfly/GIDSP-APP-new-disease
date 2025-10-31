import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Table, Tag, Tooltip, message, Modal, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import {
  getProgramMetadata,
  getOptionSet,
  getMe,
  queryTrackedEntities,
  deleteTrackedEntity,
  batchPushToEpi,
  PROGRAM_ID,
  PROGRAM_STAGE_INVESTIGATION_ID,
  OS_DISEASE_ID,
  OS_CASE_STATUS_ID,
  DE_PUSH_EPI,
} from '../services/caseService';
import type { OptionSet } from '../services/caseService';
import { mapTEIsToRows, type CaseRow } from '../services/mappers/caseMappers';
import OrgUnitSelect from '../components/common/OrgUnitSelect';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const statusTagColor = (status?: CaseRow['statusTag']) => {
  if (status === '待核实') return 'gold';
  if (status === '处理中') return 'blue';
  if (status === '已关闭') return 'green';
  return 'default';
};

const CaseList = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [diseaseOS, setDiseaseOS] = useState<OptionSet | null>(null);
  const [statusOS, setStatusOS] = useState<OptionSet | null>(null);
  const [meOrgUnitId, setMeOrgUnitId] = useState<string | undefined>(undefined);

  const [data, setData] = useState<CaseRow[]>([]);
  const [pager, setPager] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 50, total: 0 });
  const [order, setOrder] = useState<'createdAt:asc' | 'createdAt:desc'>('createdAt:desc');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // initial metadata load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await getProgramMetadata();
        const [disease, status, me] = await Promise.all([
          getOptionSet(OS_DISEASE_ID),
          getOptionSet(OS_CASE_STATUS_ID),
          getMe(),
        ]);
        setDiseaseOS(disease);
        setStatusOS(status);
        setMeOrgUnitId(me.organisationUnits?.[0]?.id);
        // default filters
        form.setFieldsValue({
          orgUnitId: me.organisationUnits?.[0]?.id,
        });
      } catch (e: any) {
        message.error(`加载元数据失败: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  // filters state
  const caseNoLike = Form.useWatch('caseNoLike', form);
  const patientNameLike = Form.useWatch('patientNameLike', form);
  const diseaseCodeEq = Form.useWatch('diseaseCodeEq', form);
  const dateRange = Form.useWatch('dateRange', form);
  const orgUnitId = Form.useWatch('orgUnitId', form);

  const debouncedCaseNo = useDebouncedValue(caseNoLike, 500);
  const debouncedPatientName = useDebouncedValue(patientNameLike, 500);

  const fetchData = useRef<(page?: number, pageSize?: number) => Promise<void>>(async () => {});

  fetchData.current = async (page = pager.page, pageSize = pager.pageSize) => {
    if (!diseaseOS) return;
    const enrolledAfter = dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined;
    const enrolledBefore = dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined;

    try {
      setLoading(true);
      const res = await queryTrackedEntities(
        {
          caseNoLike: debouncedCaseNo,
          patientNameLike: debouncedPatientName,
          diseaseCodeEq,
          enrolledAfter,
          enrolledBefore,
          orgUnitId: orgUnitId || meOrgUnitId,
          page,
          pageSize,
          order,
        },
      );
      const rows = mapTEIsToRows(res.trackedEntities, diseaseOS);
      setData(rows);
      setPager({ page: res.pager.page, pageSize: res.pager.pageSize, total: res.pager.total });
      setSelectedRowKeys([]); // reset selection on new data
    } catch (e: any) {
      message.error(`查询失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // auto query on filter changes
  useEffect(() => {
    if (!diseaseOS) return;
    fetchData.current(1, pager.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseOS, debouncedCaseNo, debouncedPatientName, diseaseCodeEq, dateRange, orgUnitId, order]);

  const columns: ColumnsType<CaseRow> = useMemo(() => [
    {
      title: '个案编号',
      dataIndex: 'caseNo',
      key: 'caseNo',
      render: (text, record) => (
        <Tooltip title={text}>
          <Link to={`/cases/${record.trackedEntity}`}>{text || '-'}</Link>
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
      title: '疾病类型',
      dataIndex: 'diseaseName',
      key: 'diseaseName',
      render: (text: string) => <Tooltip title={text}>{text || '-'}</Tooltip>,
    },
    {
      title: '报告日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      sorter: true,
      render: (text: string) => text || '-',
    },
    {
      title: '个案状态',
      dataIndex: 'statusTag',
      key: 'status',
      render: (status: CaseRow['statusTag']) => <Tag color={statusTagColor(status)}>{status || '处理中'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/cases/${record.trackedEntity}`}>查看</Link>
          <a onClick={() => onDelete(record)}>删除</a>
          <a onClick={() => onPush([record])}>推送</a>
        </Space>
      ),
    },
  ], // eslint-disable-next-line react-hooks/exhaustive-deps
  [order]);

  const onTableChange = (pagination: TablePaginationConfig, _filters: any, sorter: any) => {
    const { current = 1, pageSize = pager.pageSize } = pagination;
    if (sorter?.field === 'reportDate') {
      // API supports createdAt/updatedAt/enrolledAt ordering; we will keep createdAt mapping here
      setOrder(sorter.order === 'ascend' ? 'createdAt:asc' : 'createdAt:desc');
    }
    fetchData.current(current, pageSize);
  };

  const onDelete = (record: CaseRow) => {
    Modal.confirm({
      title: '确认删除该个案？',
      content: `删除 TEI: ${record.trackedEntity} 将执行级联删除（需权限）。`,
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTrackedEntity(record.trackedEntity);
          message.success('删除成功');
          fetchData.current();
        } catch (e: any) {
          message.error(`删除失败: ${e.message}`);
        }
      },
    });
  };

  const onPush = async (rows: CaseRow[]) => {
    // Per contract, UPDATE events to set DePushEpi01=true. We don't have event IDs; we will perform a best-effort:
    // As we only have enrollment here, construct events with minimal fields; DHIS2 requires event uid for UPDATE.
    // If event uid unknown, this operation may fail per item. We will alert the user accordingly.
    const now = dayjs().toISOString();
    const events = rows
      .filter((r) => r.enrollment && r.trackedEntity && r.orgUnit)
      .map((r) => ({
        event: r.enrollment as string, // NOTE: placeholder; ideally should be real event uid
        programStage: PROGRAM_STAGE_INVESTIGATION_ID,
        program: PROGRAM_ID,
        enrollment: r.enrollment!,
        trackedEntity: r.trackedEntity,
        orgUnit: r.orgUnit!,
        status: 'ACTIVE' as const,
        occurredAt: now,
        dataValues: [
          { dataElement: DE_PUSH_EPI, value: 'true' },
        ],
      }));

    if (!events.length) {
      message.warning('所选记录缺少Enrollment或机构信息，无法推送。');
      return;
    }

    try {
      const res = await batchPushToEpi(events);
      if (res.status === 'OK') {
        message.success(`推送完成：更新 ${res.stats.updated} 条`);
      } else {
        message.warning(`推送完成：状态 ${res.status}，请检查对象报告`);
      }
    } catch (e: any) {
      message.error(`推送失败: ${e.message}`);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleBatchPush = () => {
    const rows = data.filter((r) => selectedRowKeys.includes(r.key));
    if (!rows.length) {
      message.info('请先选择要推送的个案');
      return;
    }
    onPush(rows);
  };

  const handleExportSelected = () => {
    const rows = data.filter((r) => selectedRowKeys.includes(r.key));
    const csv = [
      ['trackedEntity', 'caseNo', 'patientName', 'diseaseName', 'reportDate', 'status'].join(','),
      ...rows.map((r) =>
        [r.trackedEntity, r.caseNo || '', r.patientName || '', r.diseaseName || '', r.reportDate || '', r.statusTag || ''].map((v) =>
          `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <Form.Item label="个案编号" name="caseNoLike">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="患者姓名" name="patientNameLike">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="疾病类型" name="diseaseCodeEq">
                <Select
                  allowClear
                  placeholder="全部"
                  options={(diseaseOS?.options || []).map((o) => ({ value: o.code, label: o.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="报告日期" name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="个案状态" name="statusCodeEq">
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
                <Button>高级筛选</Button>
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
                <Link to="/cases/new">新增个案</Link>
              </Button>
              <Button disabled>批量导入</Button>
              <Button onClick={handleExportSelected}>导出Excel</Button>
            </Space>
          </Col>
          <Col>
            <Text>共 {pager.total} 条</Text>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="key"
          loading={loading}
          rowSelection={rowSelection}
          onRow={(record) => ({
            onClick: () => {
              setSelectedRowKeys((prev) => {
                const exists = prev.includes(record.key);
                if (exists) return prev.filter((k) => k !== record.key);
                return prev.concat(record.key);
              });
            },
            onDoubleClick: () => navigate(`/cases/${record.trackedEntity}`),
          })}
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
          footer={() => (
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Tag>
                    已选 {selectedRowKeys.length} 项
                  </Tag>
                  <Button onClick={() => setSelectedRowKeys(data.map((d) => d.key))}>全选本页</Button>
                  <Button onClick={() => setSelectedRowKeys([])}>清空选择</Button>
                  <Button type="primary" onClick={handleBatchPush}>批量推送</Button>
                  <Button onClick={handleExportSelected}>批量导出</Button>
                </Space>
              </Col>
              <Col />
            </Row>
          )}
          scroll={{ x: 900 }}
        />
      </Card>
    </Space>
  );
};

export default CaseList;