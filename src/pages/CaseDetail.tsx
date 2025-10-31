import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tabs, Tag, Space, Button, Empty, Typography, message } from 'antd';
import { useCaseDetails } from '../hooks/useCaseDetails';
import FollowUpList from '../components/case/FollowUpList';
import TreatmentList from '../components/case/TreatmentList';
import TestList from '../components/case/TestList';
import TrackingList from '../components/case/TrackingList';
import OperationLogs from '../components/case/OperationLogs';

const { TabPane } = Tabs;

const statusTagColor = (status?: string) => {
  if (!status) return 'default';
  if (status === 'VERIFIED' || status === '处理中' || status === 'ACTIVE') return 'blue';
  if (status === 'CLOSED' || status === '已关闭' || status === 'COMPLETED') return 'green';
  if (status === '待核实' || status === 'CANCELLED') return 'gold';
  return 'default';
};

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('1');

  const {
    loading,
    error,
    header,
    epi,
    followUps,
    followPager,
    treatments,
    treatPager,
    tests,
    testPager,
    trackings,
    trackPager,
    logs,
    loadFollowUps,
    loadTreatments,
    loadTests,
    loadTrackings,
    loadLogs,
    doPushEpi,
    doCloseCase,
  } = useCaseDetails(id!);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    if (activeTab === '3' && followUps.length === 0) loadFollowUps(1);
    if (activeTab === '4' && treatments.length === 0) loadTreatments(1);
    if (activeTab === '5' && tests.length === 0) loadTests(1);
    if (activeTab === '6' && trackings.length === 0) loadTrackings(1);
    if (activeTab === '7' && logs.tei.length === 0 && logs.event.length === 0) loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (!id) return <Empty description="缺少个案ID" />;
  if (!header && loading) return <Empty description="加载中..." />;
  if (!header) return <Empty description="未找到个案信息" />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Descriptions title={`个案编号: ${header.caseNo || '-'}`} bordered column={2}
          extra={
            <Space>
              <Button type="primary"><Link to={`/cases/${header.trackedEntity}/edit`}>编辑</Link></Button>
              <Button onClick={async () => { try { await doPushEpi(); message.success('已推送至流调'); } catch (e: any) { message.error(e.message || '推送失败'); } }}>推送流调</Button>
              <Button danger onClick={async () => { try { await doCloseCase(); message.success('已结案'); } catch (e: any) { message.error(e.message || '结案失败'); } }}>结案</Button>
              <Button><Link to="/cases">返回列表</Link></Button>
            </Space>
          }
        >
          <Descriptions.Item label="患者姓名">{header.fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="个案状态"><Tag color={statusTagColor(header.statusTag)}>{header.statusTag || '-'}</Tag></Descriptions.Item>
          <Descriptions.Item label="疾病编码">{header.diseaseCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="报告日期">{header.reportDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="报告单位">{'-'}</Descriptions.Item>
          <Descriptions.Item label="报告人">{'-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="1">
            <Descriptions title="患者基本信息" bordered column={2}>
              <Descriptions.Item label="姓名">{header.fullName || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{'-'}</Descriptions.Item>
              <Descriptions.Item label="年龄">{'-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{'-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{'-'}</Descriptions.Item>
              <Descriptions.Item label="现住址" span={2}>{'-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="报告信息" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="报告单位">{'-'}</Descriptions.Item>
              <Descriptions.Item label="报告人员">{'-'}</Descriptions.Item>
              <Descriptions.Item label="报告日期">{header.reportDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="症状开始">{'-'}</Descriptions.Item>
              <Descriptions.Item label="诊断日期">{'-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="诊断信息" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="初步诊断">{'-'}</Descriptions.Item>
              <Descriptions.Item label="确诊诊断">{'-'}</Descriptions.Item>
              <Descriptions.Item label="个案来源" span={2}>{'-'}</Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab="流行病学信息" key="2">
            {epi ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Paragraph>
                  <Typography.Text strong>暴露史:</Typography.Text> {epi.exposureHistory || '无'}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  <Typography.Text strong>接触史:</Typography.Text> {epi.contactHistory || '无'}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  <Typography.Text strong>旅行史:</Typography.Text> {epi.travelHistory || '无'}
                </Typography.Paragraph>
              </Space>
            ) : (
              <Empty description="暂无调查信息" />
            )}
          </TabPane>

          <TabPane tab="随访记录" key="3">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${header.trackedEntity}/follow-ups/new`}>新增随访记录</Link>
            </Button>
            <FollowUpList caseId={header.trackedEntity} items={followUps} pager={followPager} onLoadMore={loadFollowUps} />
          </TabPane>

          <TabPane tab="治疗记录" key="4">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${header.trackedEntity}/treatments/new`}>新增治疗记录</Link>
            </Button>
            <TreatmentList caseId={header.trackedEntity} items={treatments} pager={treatPager} onLoadMore={loadTreatments} />
          </TabPane>

          <TabPane tab="检测记录" key="5">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${header.trackedEntity}/test-records/new`}>新增检测记录</Link>
            </Button>
            <TestList caseId={header.trackedEntity} items={tests} pager={testPager} onLoadMore={loadTests} />
          </TabPane>

          <TabPane tab="追踪记录" key="6">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${header.trackedEntity}/tracking-records/new`}>新增追踪记录</Link>
            </Button>
            <TrackingList caseId={header.trackedEntity} items={trackings} pager={trackPager} onLoadMore={loadTrackings} />
          </TabPane>

          <TabPane tab="操作日志" key="7">
            <OperationLogs teiLogs={logs.tei} eventLogs={logs.event} />
          </TabPane>
        </Tabs>
      </Card>
    </Space>
  );
};

export default CaseDetail;