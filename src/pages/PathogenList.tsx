import { Button, Card, Col, Input, Row, Space, Table, Tag, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { listOptions as apiList, deleteOptionFromSet } from '../api/optionsService';
import { useEffect, useMemo, useState } from 'react';
import { exportToExcel } from '../utils/exportExcel';
import { OPTION_SET_IDS, ATTRIBUTE_IDS } from '../types/dhis2';
import { listOptions as listCachedOptions } from '../api/optionSets';

interface RowData {
  id: string;
  name: string;
  code?: string;
  scientificName?: string;
  type?: string;
  typeRaw?: string;
  bsl?: string;
  bslRaw?: string;
}

const DEFAULT_PAGE_SIZE = 50;

const PathogenList = () => {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pager, setPager] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, pageCount: 1 });
  const [search, setSearch] = useState('');

  const typeOptions = listCachedOptions(OPTION_SET_IDS.PathogenType);
  const bslOptions = listCachedOptions(OPTION_SET_IDS.BioSafetyLevel);

  const columns: ColumnsType<RowData> = useMemo(() => [
    { title: '病原体名称', dataIndex: 'name', key: 'name' },
    { title: '病原体编码', dataIndex: 'code', key: 'code' },
    { title: '学名', dataIndex: 'scientificName', key: 'scientificName' },
    { title: '病原体类型', dataIndex: 'type', key: 'type' },
    {
      title: '生物安全等级',
      dataIndex: 'bsl',
      key: 'bsl',
      render: (bsl: string) => {
        let color: any = 'default';
        if (bsl === 'BSL-4') color = 'red';
        if (bsl === 'BSL-3') color = 'orange';
        if (bsl === 'BSL-2') color = 'gold';
        if (bsl === 'BSL-1') color = 'green';
        return <Tag color={color}>{bsl || ''}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/pathogens/${record.id}/edit`}>编辑</Link>
          <Popconfirm
            title="确认删除该病原体？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => onDelete(record.id)}
          >
            <a>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ], []);

  async function load(page = pager.page, pageSize = pager.pageSize, kw = search) {
    setLoading(true);
    try {
      const resp = await apiList({
        optionSetId: OPTION_SET_IDS.Pathogens,
        page,
        pageSize,
        search: kw,
        order: 'sortOrder:asc',
      });

      const rows: RowData[] = resp.options.map((opt) => {
        const scientificName = (opt.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.SCIENTIFIC_NAME)?.value as string | undefined;
        const typeRaw = (opt.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.PATHOGEN_TYPE)?.value as string | undefined;
        const bslRaw = (opt.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.BSL)?.value as string | undefined;
        const type = (typeOptions.find((o) => (o.code || o.id) === typeRaw)?.name) || '';
        const bsl = (bslOptions.find((o) => (o.code || o.id) === bslRaw)?.name) || '';
        return {
          id: opt.id,
          name: opt.displayName || opt.name,
          code: opt.code,
          scientificName,
          type,
          typeRaw,
          bsl,
          bslRaw,
        };
      });
      setData(rows);
      setPager(resp.pager);
    } catch (e: any) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, DEFAULT_PAGE_SIZE, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(id: string) {
    try {
      await deleteOptionFromSet(OPTION_SET_IDS.Pathogens, id);
      await fetch(`/api/29/options/${id}`, { method: 'DELETE' }); // second step
      message.success('删除成功');
      load(pager.page, pager.pageSize, search);
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    }
  }

  function onExport() {
    const rows = data.map((r) => ({
      病原体名称: r.name,
      病原体编码: r.code,
      学名: r.scientificName,
      病原体类型: r.type || '',
      生物安全等级: r.bsl || '',
    }));
    exportToExcel(rows, '病原微生物.xlsx');
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Row gutter={16} justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary">
                <Link to="/pathogens/new">新增病原体</Link>
              </Button>
              <Button onClick={onExport}>导出</Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="按名称、编码或ID搜索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={() => load(1, pager.pageSize, search)}
                style={{ width: 260 }}
              />
              <Button type="primary" onClick={() => load(1, pager.pageSize, search)}>搜索</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pager.page,
            pageSize: pager.pageSize,
            total: pager.total,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, pageSize) => {
              setPager((p) => ({ ...p, page, pageSize }));
              load(page, pageSize, search);
            },
          }}
        />
      </Card>
    </Space>
  );
};

export default PathogenList;