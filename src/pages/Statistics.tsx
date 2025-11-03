import { Card, Col, DatePicker, Form, Row, Select, Space, Button, Checkbox, Radio } from 'antd';

const { RangePicker } = DatePicker;

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
                <div>图表功能已移除</div>
            </Card>
        </Space>
    );
};

export default Statistics;