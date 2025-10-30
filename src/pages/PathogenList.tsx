import { Button, Card, Col, Input, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { type Pathogen, pathogens } from '../data/pathogens';
import { Link } from 'react-router-dom'; // Import Link

const columns: ColumnsType<Pathogen> = [
    {
        title: '病原体名称',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '病原体编码',
        dataIndex: 'code',
        key: 'code',
    },
    {
        title: '学名',
        dataIndex: 'scientificName',
        key: 'scientificName',
    },
    {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
    },
    {
        title: '生物安全等级',
        dataIndex: 'bsl',
        key: 'bsl',
        render: (bsl: string) => {
            let color = 'default';
            if (bsl === 'BSL-4') color = 'red';
            if (bsl === 'BSL-3') color = 'orange';
            if (bsl === 'BSL-2') color = 'gold';
            if (bsl === 'BSL-1') color = 'green';
            return <Tag color={color}>{bsl}</Tag>;
        },
    },
    {
        title: '操作',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
                <Link to={`/pathogens/${record.id}/edit`}>编辑</Link> {/* Updated link */}
                <a>关联疾病</a>
            </Space>
        ),
    },
];

const PathogenList = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Row gutter={16} justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Button type="primary">
                                <Link to="/pathogens/new">新增病原体</Link> {/* Updated link */}
                            </Button>
                            <Button>导入</Button>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Input placeholder="搜索病原体名称/编码" />
                            <Select placeholder="类型" style={{ width: 120 }} />
                            <Button type="primary">搜索</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={pathogens}
                    rowKey="id"
                    pagination={{
                        total: pathogens.length,
                        showTotal: total => `共 ${total} 条`,
                    }}
                />
            </Card>
        </Space>
    );
};

export default PathogenList;