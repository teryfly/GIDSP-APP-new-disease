import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { type Case, cases } from '../data/cases';
import { diseaseCodes } from '../data/diseaseCodes'; // Import diseaseCodes

const { RangePicker } = DatePicker;
const { Option } = Select; // Destructure Option from Select

const columns: ColumnsType<Case> = [
    {
        title: '个案编号',
        dataIndex: 'caseNo',
        key: 'caseNo',
        render: (text, record) => <Link to={`/cases/${record.id}`}>{text}</Link>,
    },
    {
        title: '患者',
        dataIndex: 'patientName',
        key: 'patientName',
    },
    {
        title: '疾病类型',
        dataIndex: 'disease',
        key: 'disease',
    },
    {
        title: '报告日期',
        dataIndex: 'reportDate',
        key: 'reportDate',
        sorter: (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime(),
    },
    {
        title: '个案状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
            let color = 'default';
            if (status === '待核实') color = 'gold';
            if (status === '处理中') color = 'blue';
            if (status === '已关闭') color = 'green';
            return <Tag color={color}>{status}</Tag>;
        },
    },
    {
        title: '操作',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
                <Link to={`/cases/${record.id}`}>查看</Link>
                <Link to={`/cases/${record.id}/edit`}>编辑</Link> {/* Updated link */}
                <Link to="#">推送</Link>
            </Space>
        ),
    },
];

const CaseList = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="个案编号">
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="患者姓名">
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="疾病类型">
                                <Select placeholder="请选择">
                                    {diseaseCodes.map(disease => (
                                        <Option key={disease.id} value={disease.diseaseName}>
                                            {disease.diseaseName}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="报告日期">
                                <RangePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="个案状态">
                                <Select placeholder="请选择">
                                    <Option value="待核实">待核实</Option>
                                    <Option value="处理中">处理中</Option>
                                    <Option value="已关闭">已关闭</Option>
                                </Select>
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
                        <Link to="/cases/new">新增个案</Link>
                    </Button>
                    <Button>批量导入</Button>
                    <Button>导出Excel</Button>
                </Space>
                <Table
                    columns={columns}
                    dataSource={cases}
                    rowKey="id"
                    pagination={{
                        total: cases.length,
                        showTotal: total => `共 ${total} 条`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                />
            </Card>
        </Space>
    );
};

export default CaseList;