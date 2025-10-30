import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tabs, Tag, Space, Button, Empty, List, Typography } from 'antd';
import { type UnknownCase, unknownCases } from '../data/unknownCases';
import { type TestRecord, testRecords } from '../data/testRecords'; // Import test records
import PushCaseFlow from '../components/PushCaseFlow';

const { TabPane } = Tabs;

const UnknownCaseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [isPushModalVisible, setIsPushModalVisible] = useState(false);
    const caseData = unknownCases.find(c => c.id === id);
    const unknownCaseTestRecords = testRecords.filter(tr => tr.unknownCaseId === id); // Filter test records for this unknown case

    if (!caseData) {
        return <Empty description="未找到病例信息" />;
    }

    const getStatusTag = (status: string) => {
        let color = 'default';
        if (status === '待检测') color = 'gold';
        if (status === '检测中') color = 'blue';
        if (status === '已确诊') color = 'success';
        if (status === '已排除') color = 'default';
        if (status === '已推送') color = 'purple';
        return <Tag color={color}>{status}</Tag>;
    };

    const getUrgencyTag = (urgency: string) => {
        let color = 'default';
        if (urgency === '高') color = 'red';
        if (urgency === '中') color = 'orange';
        if (urgency === '低') color = 'green';
        return <Tag color={color}>{urgency}</Tag>;
    };

    return (
        <>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                    <Descriptions title={`病例编号: ${caseData.caseNo}`} bordered column={2}
                        extra={
                            <Space>
                                {caseData.status !== '已推送' && 
                                    <Button type="primary"><Link to={`/unknown-cases/${caseData.id}/edit`}>编辑</Link></Button> /* Updated link */
                                }
                                {caseData.status === '已确诊' && <Button type="primary" danger onClick={() => setIsPushModalVisible(true)}>推送至个案管理</Button>}
                                <Button><Link to="/unknown-cases">返回列表</Link></Button>
                            </Space>
                        }
                    >
                        <Descriptions.Item label="患者姓名">{caseData.patientName}</Descriptions.Item>
                        <Descriptions.Item label="病例状态">{getStatusTag(caseData.status)}</Descriptions.Item>
                        <Descriptions.Item label="紧急度">{getUrgencyTag(caseData.urgency)}</Descriptions.Item>
                        <Descriptions.Item label="报告日期">{caseData.reportDate}</Descriptions.Item>
                        {caseData.confirmedDisease && <Descriptions.Item label="确诊疾病">{caseData.confirmedDisease}</Descriptions.Item>}
                    </Descriptions>
                </Card>
                <Card>
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="基本信息" key="1">
                            <Descriptions title="患者基本信息" bordered column={2}>
                                <Descriptions.Item label="姓名">{caseData.patientName}</Descriptions.Item>
                                <Descriptions.Item label="性别">{caseData.gender}</Descriptions.Item>
                                <Descriptions.Item label="年龄">{caseData.age}</Descriptions.Item>
                            </Descriptions>
                        </TabPane>
                        <TabPane tab="临床症状" key="2">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <p>{caseData.symptoms}</p>
                                <Button type="primary">
                                    <Link to={`/unknown-cases/${caseData.id}/edit`}>编辑临床症状</Link>
                                </Button>
                            </Space>
                        </TabPane>
                        <TabPane tab="检测记录" key="3">
                            <Button type="primary" style={{ marginBottom: 16 }}>
                                <Link to={`/unknown-cases/${caseData.id}/test-records/new`}>新增检测记录</Link>
                            </Button>
                            <List
                                dataSource={unknownCaseTestRecords}
                                renderItem={(item: TestRecord) => (
                                    <List.Item>
                                        <Card style={{ width: '100%' }} title={`🧪 ${item.testType} | ${item.collectionTime}`}>
                                            <Descriptions column={2}>
                                                <Descriptions.Item label="样本类型">{item.sampleType}</Descriptions.Item>
                                                <Descriptions.Item label="检测结果"><Tag color={item.result === '阳性' ? 'red' : 'green'}>{item.result}</Tag></Descriptions.Item>
                                                <Descriptions.Item label="病原体" span={2}>{item.pathogen || 'N/A'}</Descriptions.Item>
                                                <Descriptions.Item label="检测机构" span={2}>{item.lab}</Descriptions.Item>
                                            </Descriptions>
                                            <Space style={{ marginTop: 16, float: 'right' }}>
                                                <Link to={`/unknown-cases/${caseData.id}/test-records/${item.id}/edit`}>编辑</Link>
                                            </Space>
                                        </Card>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Empty description="暂无检测记录" /> }}
                            />
                        </TabPane>
                        <TabPane tab="推送记录" key="4">
                            <Empty description="暂无推送记录" />
                        </TabPane>
                    </Tabs>
                </Card>
            </Space>
            <PushCaseFlow
                visible={isPushModalVisible}
                onClose={() => setIsPushModalVisible(false)}
                caseData={caseData}
            />
        </>
    );
};

export default UnknownCaseDetail;