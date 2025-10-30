import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tabs, Tag, Space, Button, Empty, List, Typography } from 'antd';
import { type Case, cases } from '../data/cases';
import { type FollowUp, followUps } from '../data/followUps';
import { type Treatment, treatments } from '../data/treatments';
import { type TestRecord, testRecords } from '../data/testRecords';
import { type TrackingRecord, trackingRecords } from '../data/trackingRecords';
import TrajectoryMap from '../components/TrajectoryMap';

const { TabPane } = Tabs;

const CaseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const caseData = cases.find(c => c.id === id);
    const caseFollowUps = followUps.filter(fu => fu.caseId === id);
    const caseTreatments = treatments.filter(t => t.caseId === id);
    const caseTestRecords = testRecords.filter(tr => tr.caseId === id);
    const caseTrackingRecords = trackingRecords.filter(tr => tr.caseId === id);

    if (!caseData) {
        return <Empty description="未找到个案信息" />;
    }

    const getStatusTag = (status: string) => {
        let color = 'default';
        if (status === '待核实') color = 'gold';
        if (status === '处理中') color = 'blue';
        if (status === '已关闭') color = 'green';
        return <Tag color={color}>{status}</Tag>;
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Descriptions title={`个案编号: ${caseData.caseNo}`} bordered column={2}
                    extra={
                        <Space>
                            <Button type="primary"><Link to={`/cases/${caseData.id}/edit`}>编辑</Link></Button> {/* Updated link */}
                            <Button>推送流调</Button>
                            <Button danger>结案</Button>
                            <Button><Link to="/cases">返回列表</Link></Button>
                        </Space>
                    }
                >
                    <Descriptions.Item label="患者姓名">{caseData.patientName}</Descriptions.Item>
                    <Descriptions.Item label="个案状态">{getStatusTag(caseData.status)}</Descriptions.Item>
                    <Descriptions.Item label="疾病">{caseData.disease}</Descriptions.Item>
                    <Descriptions.Item label="报告日期">{caseData.reportDate}</Descriptions.Item>
                    <Descriptions.Item label="报告人">{caseData.reporter}</Descriptions.Item>
                    <Descriptions.Item label="报告单位">{caseData.reportUnit}</Descriptions.Item>
                </Descriptions>
            </Card>
            <Card>
                <Tabs defaultActiveKey="1">
                    <TabPane tab="基本信息" key="1">
                        <Descriptions title="患者基本信息" bordered column={2}>
                            <Descriptions.Item label="姓名">{caseData.patientName}</Descriptions.Item>
                            <Descriptions.Item label="性别">{caseData.gender}</Descriptions.Item>
                            <Descriptions.Item label="年龄">{caseData.age}</Descriptions.Item>
                            <Descriptions.Item label="身份证号">{caseData.idCard}</Descriptions.Item>
                            <Descriptions.Item label="联系电话">{caseData.phone}</Descriptions.Item>
                            <Descriptions.Item label="现住址" span={2}>{caseData.address}</Descriptions.Item>
                        </Descriptions>
                        <Descriptions title="诊断信息" bordered column={2} style={{ marginTop: 24 }}>
                            <Descriptions.Item label="症状开始日期">{caseData.symptomOnsetDate}</Descriptions.Item>
                            <Descriptions.Item label="诊断日期">{caseData.diagnosisDate}</Descriptions.Item>
                            <Descriptions.Item label="诊断" span={2}>{caseData.diagnosis}</Descriptions.Item>
                            <Descriptions.Item label="个案来源" span={2}>{caseData.source}</Descriptions.Item>
                        </Descriptions>
                    </TabPane>
                    <TabPane tab="流行病学信息" key="2">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Typography.Paragraph>
                                <Typography.Text strong>暴露史:</Typography.Text> 曾到疫区出差，接触过高风险人群。
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text strong>接触史:</Typography.Text> 无明确接触史。
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text strong>旅行史:</Typography.Text> 2024-01-01至2024-01-05曾前往外省某市。
                            </Typography.Paragraph>
                            <Button type="primary">
                                {/* Changed Link to pass query parameter for step 1 (epidemiology) */}
                                <Link to={`/cases/${caseData.id}/edit?step=1`}>编辑流行病学信息</Link>
                            </Button>
                        </Space>
                    </TabPane>
                    <TabPane tab="随访记录" key="3">
                        <Button type="primary" style={{ marginBottom: 16 }}>
                            <Link to={`/cases/${caseData.id}/follow-ups/new`}>新增随访记录</Link> {/* Updated link */}
                        </Button>
                        <List
                            dataSource={caseFollowUps}
                            renderItem={(item: FollowUp) => (
                                <List.Item>
                                    <Card style={{ width: '100%' }} title={`📅 ${item.date} | ${item.method} | ${item.doctor}`}>
                                        <Descriptions column={2}>
                                            <Descriptions.Item label="健康状态"><Tag color={item.healthStatus === '异常' || item.healthStatus === '恶化' ? 'red' : 'green'}>{item.healthStatus}</Tag></Descriptions.Item>
                                            <Descriptions.Item label="体温">{item.temperature}</Descriptions.Item>
                                            <Descriptions.Item label="症状" span={2}>{item.symptoms}</Descriptions.Item>
                                            <Descriptions.Item label="备注" span={2}>{item.notes}</Descriptions.Item>
                                        </Descriptions>
                                        <Space style={{ marginTop: 16, float: 'right' }}>
                                            <Link to={`/cases/${caseData.id}/follow-ups/${item.id}/edit`}>编辑</Link> {/* Updated link */}
                                        </Space>
                                    </Card>
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无随访记录" /> }}
                        />
                    </TabPane>
                    <TabPane tab="治疗记录" key="4">
                         <Button type="primary" style={{ marginBottom: 16 }}>
                            <Link to={`/cases/${caseData.id}/treatments/new`}>新增治疗记录</Link> {/* Updated link */}
                        </Button>
                        <List
                            dataSource={caseTreatments}
                            renderItem={(item: Treatment) => (
                                <List.Item>
                                    <Card style={{ width: '100%' }} title={`🏥 ${item.hospital} | ${item.date}`}>
                                        <Descriptions column={2}>
                                            <Descriptions.Item label="治疗类型"><Tag>{item.type}</Tag></Descriptions.Item>
                                            <Descriptions.Item label="治疗结果"><Tag color={item.outcome === '治愈' || item.outcome === '好转' ? 'green' : 'red'}>{item.outcome}</Tag></Descriptions.Item>
                                            <Descriptions.Item label="诊断" span={2}>{item.diagnosis}</Descriptions.Item>
                                            <Descriptions.Item label="治疗方案" span={2}>{item.plan}</Descriptions.Item>
                                        </Descriptions>
                                        <Space style={{ marginTop: 16, float: 'right' }}>
                                            <Link to={`/cases/${caseData.id}/treatments/${item.id}/edit`}>编辑</Link> {/* Added edit link */}
                                        </Space>
                                    </Card>
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无治疗记录" /> }}
                        />
                    </TabPane>
                    <TabPane tab="检测记录" key="5">
                        <Button type="primary" style={{ marginBottom: 16 }}>
                            <Link to={`/cases/${caseData.id}/test-records/new`}>新增检测记录</Link> {/* Updated link */}
                        </Button>
                         <List
                            dataSource={caseTestRecords}
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
                                            <Link to={`/cases/${caseData.id}/test-records/${item.id}/edit`}>编辑</Link> {/* Added edit link */}
                                        </Space>
                                    </Card>
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无检测记录" /> }}
                        />
                    </TabPane>
                    <TabPane tab="追踪记录" key="6">
                        <TrajectoryMap records={caseTrackingRecords} />
                        <Button type="primary" style={{ marginTop: 16 }}>
                            <Link to={`/cases/${caseData.id}/tracking-records/new`}>新增追踪记录</Link> {/* Updated link */}
                        </Button>
                        <List
                            dataSource={caseTrackingRecords}
                            renderItem={(item: TrackingRecord) => (
                                <List.Item>
                                    <Card style={{ width: '100%' }} title={`📍 ${item.type} | ${item.date}`}>
                                        <Descriptions column={1}>
                                            <Descriptions.Item label="地点">{item.location}</Descriptions.Item>
                                            <Descriptions.Item label="描述">{item.description}</Descriptions.Item>
                                        </Descriptions>
                                        <Space style={{ marginTop: 16, float: 'right' }}>
                                            <Link to={`/cases/${caseData.id}/tracking-records/${item.id}/edit`}>编辑</Link> {/* Added edit link */}
                                        </Space>
                                    </Card>
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无追踪记录" /> }}
                        />
                    </TabPane>
                    <TabPane tab="操作日志" key="7">
                        <Empty description="暂无操作日志" />
                    </TabPane>
                </Tabs>
            </Card>
        </Space>
    );
};

export default CaseDetail;