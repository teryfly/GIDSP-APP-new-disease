import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, Descriptions, Tabs, Tag, Space, Button, Empty, Typography, message, Spin, Dropdown } from 'antd';
import { DownOutlined, EditOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
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

const genderMap: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
};

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
    loadLogs,
    doPushEpi,
    doCloseCase,
  } = useCaseDetails(id!);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['1', '2', '3', '4', '5', '6', '7'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    if (activeTab === '7' && logs.tei.length === 0 && logs.event.length === 0) loadLogs();
  }, [activeTab]);

  const editMenuItems: MenuProps['items'] = [
    {
      key: 'basic',
      label: '编辑基本信息',
      onClick: () => navigate(`/cases/${id}/edit-basic`),
    },
    {
      key: 'epi',
      label: '编辑流行病学信息',
      onClick: () => navigate(`/cases/${id}/edit-epi`),
    },
    {
      key: 'diagnosis',
      label: '编辑诊断信息',
      onClick: () => navigate(`/cases/${id}/edit-diagnosis`),
    },
  ];

  if (!id) return <Empty description="缺少个案ID" />;
  if (loading && !header) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!header) return <Empty description="未找到个案信息" />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Descriptions
          title={`个案编号: ${header.caseNo || '-'}`}
          bordered
          column={2}
          extra={
            <Space>
              <Dropdown menu={{ items: editMenuItems }} placement="bottomRight">
                <Button type="primary" icon={<EditOutlined />}>
                  编辑 <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                onClick={async () => {
                  try {
                    await doPushEpi();
                    message.success('已成功推送至流调系统');
                  } catch (e: any) {
                    message.error(e.message || '推送失败');
                  }
                }}
              >
                推送流调
              </Button>
              <Button
                danger
                onClick={async () => {
                  try {
                    await doCloseCase();
                    message.success('已成功结案');
                  } catch (e: any) {
                    message.error(e.message || '结案失败');
                  }
                }}
              >
                结案
              </Button>
              <Button onClick={() => navigate('/cases')}>返回列表</Button>
            </Space>
          }
        >
          <Descriptions.Item label="患者姓名">{header.fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="个案状态">
            <Tag color={statusTagColor(header.statusTag)}>{header.statusTag || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="疾病编码">{header.diseaseCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="报告日期">{header.reportDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="报告单位">{header.reportOrgName || '-'}</Descriptions.Item>
          <Descriptions.Item label="症状开始日期">{header.symptomOnsetDate || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="1">
            <Descriptions title="患者基本信息" bordered column={2}>
              <Descriptions.Item label="姓名">{header.fullName || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{genderMap[header.genderZh || ''] || header.genderZh || '-'}</Descriptions.Item>
              <Descriptions.Item label="年龄">{header.age ? `${header.age}岁` : '-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{header.nationalId || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{header.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="现住址" span={2}>{header.address || '-'}</Descriptions.Item>
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
              <Link to={`/cases/${id}/follow-ups/new`}>新增随访记录</Link>
            </Button>
            <FollowUpList caseId={id} items={followUps} pager={followPager} />
          </TabPane>

          <TabPane tab="治疗记录" key="4">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${id}/treatments/new`}>新增治疗记录</Link>
            </Button>
            <TreatmentList caseId={id} items={treatments} pager={treatPager} />
          </TabPane>

          <TabPane tab="检测记录" key="5">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${id}/test-records/new`}>新增检测记录</Link>
            </Button>
            <TestList caseId={id} items={tests} pager={testPager} />
          </TabPane>

          <TabPane tab="追踪记录" key="6">
            <Button type="primary" style={{ marginBottom: 16 }}>
              <Link to={`/cases/${id}/tracking-records/new`}>新增追踪记录</Link>
            </Button>
            <TrackingList caseId={id} items={trackings} pager={trackPager} />
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