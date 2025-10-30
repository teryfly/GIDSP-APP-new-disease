import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { type UnknownCase, unknownCases } from '../data/unknownCases';

const { RangePicker } = DatePicker;

const columns: ColumnsType<UnknownCase> = [
    {
        title: '病例编号',
        dataIndex: 'caseNo',
        key: 'caseNo',
        render: (text, record) => <Link to={`/unknown-cases/${record.id}`}>{text}</Link>,
    },
    {
        title: '患者',
        dataIndex: 'patientName',
        key: 'patientName',
    },
    {
        title: '报告日期',
        dataIndex: 'reportDate',
        key: 'reportDate',
        sorter: (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime(),
    },
    {
        title: '病例状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
            let color = 'default';
            if (status === '待检测') color = 'gold';
            if (status === '检测中') color = 'blue';
            if (status === '已确诊') color = 'success';
            if (status === '已排除') color = 'default';
            if (status === '已推送') color = 'purple';
            return <Tag color={color}>{status}</Tag>;
        },
    },
    {
        title: '紧急度',
        dataIndex: 'urgency',
        key: 'urgency',
        render: (urgency: string) => {
            let color = 'default';
            if (urgency === '高') color = 'red';
            if (urgency === '中') color = 'orange';
            if (urgency === '低') color = 'green';
            return <Tag color={color}>{urgency}</Tag>;
        },
    },
    {
        title: '操作',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
                <Link to={`/unknown-cases/${record.id}`}>查看</Link>
                {record.status !== '已推送' && record.status !== '已排除' && 
                    <Link to={`/unknown-cases/${record.id}/edit`}>编辑</Link> /* Updated link */
                }
                {record.status === '已确诊' && <Link to={`/unknown-cases/${record.id}`}>推送</Link>}
            </Space>
        ),
    },
];

const UnknownCaseList = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="病例编号">
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="患者姓名">
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="病例状态">
                                <Select placeholder="请选择" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Space>
                                <Button type="primary">查询</Button>
                                <Button>重置</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card>
                <Space style={{ marginBottom: 16 }}>
                    <Button type="primary">
                        <Link to="/unknown-cases/new">新增病例</Link> {/* Updated link */}
                    </Button>
                    <Button>导出Excel</Button>
                </Space>
                <Table
                    columns={columns}
                    dataSource={unknownCases}
                    rowKey="id"
                    pagination={{
                        total: unknownCases.length,
                        showTotal: total => `共 ${total} 条`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                />
            </Card>
        </Space>
    );
};

export default UnknownCaseList;