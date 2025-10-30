import { Button, Card, Col, Input, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { type DiseaseCode, diseaseCodes } from '../data/diseaseCodes';
import { Link } from 'react-router-dom'; // Import Link

const columns: ColumnsType<DiseaseCode> = [
    {
        title: '疾病名称',
        dataIndex: 'diseaseName',
        key: 'diseaseName',
    },
    {
        title: '疾病编码',
        dataIndex: 'diseaseCode',
        key: 'diseaseCode',
    },
    {
        title: 'ICD-10',
        dataIndex: 'icd10',
        key: 'icd10',
    },
    {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        render: (category: string) => {
            let color = 'blue';
            if (category === '甲类') color = 'red';
            if (category === '乙类') color = 'orange';
            if (category === '丙类') color = 'green';
            return <Tag color={color}>{category}</Tag>;
        },
    },
    {
        title: '风险等级',
        dataIndex: 'riskLevel',
        key: 'riskLevel',
        render: (level: string) => {
            let color = 'default';
            if (level === '高') color = 'red';
            if (level === '中') color = 'orange';
            if (level === '低') color = 'green';
            return <Tag color={color}>{level}</Tag>;
        },
    },
    {
        title: '操作',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
                <Link to={`/disease-codes/${record.id}/edit`}>编辑</Link> {/* Updated link */}
                <a>删除</a>
            </Space>
        ),
    },
];

const DiseaseCodeList = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Row gutter={16} justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Button type="primary">
                                <Link to="/disease-codes/new">新增编码</Link> {/* Updated link */}
                            </Button>
                            <Button>导入</Button>
                            <Button>导出</Button>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Input placeholder="搜索疾病名称/编码" />
                            <Select placeholder="分类" style={{ width: 120 }} />
                            <Button type="primary">搜索</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={diseaseCodes}
                    rowKey="id"
                    pagination={{
                        total: diseaseCodes.length,
                        showTotal: total => `共 ${total} 条`,
                    }}
                />
            </Card>
        </Space>
    );
};

export default DiseaseCodeList;