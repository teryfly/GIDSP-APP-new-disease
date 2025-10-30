import { Card, Col, DatePicker, Form, Row, Select, Space, Button, Checkbox, Radio } from 'antd';
import { Line } from '@ant-design/charts';

const { RangePicker } = DatePicker;

const data = [
    { date: '01-01', value: 7, disease: '新冠肺炎' },
    { date: '01-02', value: 9, disease: '新冠肺炎' },
    { date: '01-03', value: 10, disease: '新冠肺炎' },
    { date: '01-04', value: 8, disease: '新冠肺炎' },
    { date: '01-15', value: 18, disease: '新冠肺炎' },
    { date: '01-22', value: 15, disease: '新冠肺炎' },
    { date: '01-29', value: 12, disease: '新冠肺炎' },
    { date: '01-01', value: 2, disease: '霍乱' },
    { date: '01-02', value: 3, disease: '霍乱' },
    { date: '01-03', value: 2, disease: '霍乱' },
    { date: '01-04', value: 1, disease: '霍乱' },
    { date: '01-15', value: 5, disease: '霍乱' },
    { date: '01-22', value: 4, disease: '霍乱' },
    { date: '01-29', value: 3, disease: '霍乱' },
];

const config = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'disease',
    legend: {
        position: 'top' as const,
    },
    smooth: true,
    animation: {
        appear: {
            animation: 'path-in' as const,
            duration: 5000,
        },
    },
};

const Statistics = () => {
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="时间范围">
                                <RangePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="地区范围">
                                <Select placeholder="请选择地区" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="疾病类别">
                                <Checkbox.Group>
                                    <Checkbox value="新冠肺炎">新冠肺炎</Checkbox>
                                    <Checkbox value="霍乱">霍乱</Checkbox>
                                    <Checkbox value="鼠疫">鼠疫</Checkbox>
                                </Checkbox.Group>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                             <Form.Item label="统计维度">
                                <Radio.Group defaultValue="day">
                                    <Radio.Button value="day">按日</Radio.Button>
                                    <Radio.Button value="week">按周</Radio.Button>
                                    <Radio.Button value="month">按月</Radio.Button>
                                </Radio.Group>
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

            <Card
                title="疾病趋势图"
                extra={
                    <Space>
                        <Button>导出Excel</Button>
                        <Button>导出图片</Button>
                    </Space>
                }
            >
                <Line {...config} />
            </Card>
        </Space>
    );
};

export default Statistics;