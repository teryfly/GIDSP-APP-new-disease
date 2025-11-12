import { Button, Card, Col, Input, Row, Space, Table, Tag, Popconfirm, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { listOptions as apiList, deleteOptionFromSet } from '../api/optionsService';
import { exportToExcel } from '../utils/exportExcel';
import { OPTION_SET_IDS, ATTRIBUTE_IDS } from '../types/dhis2';
import { listOptions as listCachedOptions } from '../api/optionSets';
interface RowData {
  id: string;
  name: string;
  code?: string;
  icd10?: string;
  category?: string; // display name
  riskLevel?: string; // display name
  categoryRaw?: string; // raw code/value
  riskLevelRaw?: string; // raw code/value
}
const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DiseaseCodeList = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pager, setPager] = useState<{ page: number; pageSize: number; total: number; pageCount: number }>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  });
  const [search, setSearch] = useState('');
  // Cached option sets for name rendering
  const categoryOptions = listCachedOptions(OPTION_SET_IDS.DiseaseCategory);
  const riskOptions = listCachedOptions(OPTION_SET_IDS.RiskLevel);
  const categoryNameByValue = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions.forEach((o) => map.set((o.code || o.id) as string, o.name));
    return map;
  }, [categoryOptions]);
  const riskNameByValue = useMemo(() => {
    const map = new Map<string, string>();
    riskOptions.forEach((o) => map.set((o.code || o.id) as string, o.name));
    return map;
  }, [riskOptions]);
  const columns: ColumnsType<RowData> = useMemo(
    () => [
      { title: '疾病名称', dataIndex: 'name', key: 'name' },
      { title: '疾病编码', dataIndex: 'code', key: 'code' },
      { title: 'ICD-10', dataIndex: 'icd10', key: 'icd10' },
      {
        title: '疾病类别',
        dataIndex: 'category',
        key: 'category',
        render: (val: string) => {
          const color = val === '甲类' ? 'red' : val === '乙类' ? 'orange' : val === '丙类' ? 'green' : 'blue';
          return <Tag color={color}>{val || ''}</Tag>;
        },
      },
      {
        title: '风险等级',
        dataIndex: 'riskLevel',
        key: 'riskLevel',
        render: (val: string) => {
          const color = val === '高' ? 'red' : val === '中' ? 'orange' : val === '低' ? 'green' : 'default';
          return <Tag color={color}>{val || ''}</Tag>;
        },
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => (
          <Space size="middle">
            <Link to={`/disease-codes/${record.id}/edit`}>编辑</Link>
            <Popconfirm
              title="确认删除该疾病编码？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => onDelete(record.id)}
            >
              <a>删除</a>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );
  async function load(page = pager.page, pageSize = pager.pageSize, kw = search) {
    setLoading(true);
    try {
      const resp = await apiList({
        optionSetId: OPTION_SET_IDS.DiseaseCodes,
        page,
        pageSize,
        search: kw,
        order: 'sortOrder:asc',
      });
      const mapped: RowData[] = resp.options.map((opt) => {
        const icd = (opt.attributeValues || []).find((a) => a.attribute.id === ATTRIBUTE_IDS.ICD_CODE)?.value as string | undefined;
        const categoryRaw = (opt.attributeValues || []).find((a) => a.attribute.id === ATTRIBUTE_IDS.DISEASE_CATEGORY)?.value as string | undefined;
        const riskRaw = (opt.attributeValues || []).find((a) => a.attribute.id === ATTRIBUTE_IDS.RISK_LEVEL)?.value as string | undefined;
        return {
          id: opt.id,
          name: opt.displayName || opt.name,
          code: opt.code,
          icd10: icd || '',
          categoryRaw,
          category: (categoryRaw && categoryNameByValue.get(categoryRaw)) || '',
          riskLevelRaw: riskRaw,
          riskLevel: (riskRaw && riskNameByValue.get(riskRaw)) || '',
        };
      });
      setRows(mapped);
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
      // two-step delete
      await deleteOptionFromSet(OPTION_SET_IDS.DiseaseCodes, id);
      await fetch(`/api/29/options/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      load(pager.page, pager.pageSize, search);
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    }
  }
  async function onExport() {
    try {
      const exportRows = rows.map((r) => ({
        疾病名称: r.name,
        疾病编码: r.code,
        'ICD-10': r.icd10,
        疾病类别: r.category || '',
        风险等级: r.riskLevel || '',
      }));
      await exportToExcel(exportRows, '疾病编码.xlsx');
    } catch (e: any) {
      message.error(e?.message || '导出失败');
    }
  }
  const pagination: TablePaginationConfig = {
    current: pager.page,
    pageSize: pager.pageSize,
    total: pager.total,
    showTotal: (total) => `共 ${total} 条`,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS as any,
    onChange: (page, pageSize) => {
      setPager((p) => ({ ...p, page, pageSize: pageSize || p.pageSize }));
      load(page, pageSize, search);
    },
  };
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Row gutter={16} justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary">
                <Link to="/disease-codes/new">新增编码</Link>
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
              <Button type="primary" onClick={() => load(1, pager.pageSize, search)}>
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <Card>
        <Table<RowData>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={pagination}
        />
      </Card>
    </Space>
  );
};
export default DiseaseCodeList;