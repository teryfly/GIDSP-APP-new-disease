import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tabs, Tag, Space, Button, Empty, List, Typography, Modal, Steps, message } from 'antd';
import { useUnknownCaseDetails } from '../hooks/useUnknownCaseDetails';
import { 
  ATR_FULL_NAME, 
  ATR_GENDER, 
  ATR_AGE, 
  ATR_NATIONAL_ID, 
  ATR_PHONE, 
  ATR_ADDRESS,
  ATR_RPT_DATE,
  ATR_SYMPT_DATE,
  ATR_UNK_SYMPT,
  ATR_UNK_NO
} from '../services/unknownCase/constants';

const { TabPane } = Tabs;

const statusTagColor = (code?: string) => {
  if (!code) return 'default';
  const up = code.toUpperCase();
  if (['PENDING', 'PEND', 'WAIT', 'TO_BE_TESTED'].includes(up)) return 'gold';
  if (['TESTING', 'IN_PROGRESS'].includes(up)) return 'blue';
  if (['CONFIRMED'].includes(up)) return 'green';
  if (['EXCLUDED', 'DISCARDED'].includes(up)) return 'default';
  return 'default';
};

export default function UnknownCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [active, setActive] = useState('1');
  const [pushing, setPushing] = useState(false);
  const [createdEnrollment, setCreatedEnrollment] = useState<string | null>(null);

  const ctx = useUnknownCaseDetails(id!);

  useEffect(() => {
    if (id) ctx.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusDvMap = useMemo(() => new Map((ctx.registerEvent?.dataValues || []).map((d: any) => [d.dataElement, String(d.value)])), [ctx.registerEvent]);
  const statusCode = statusDvMap.get('DeUnkStat01');
  const pushed = (statusDvMap.get('DePushCase1') || '').toLowerCase() === 'true';

  // 提取完整的患者信息
  const patientInfo = useMemo(() => {
    if (!ctx.header) return null;
    const attrs = ctx.header.teiAttributes || new Map();
    const genderCode = attrs.get(ATR_GENDER);
    const genderName = ctx.genderMap.get(genderCode || '') || genderCode || '-';
    
    return {
      fullName: attrs.get(ATR_FULL_NAME) || '-',
      gender: genderName,
      age: attrs.get(ATR_AGE) || '-',
      nationalId: attrs.get(ATR_NATIONAL_ID) || '-',
      phone: attrs.get(ATR_PHONE) || '-',
      address: attrs.get(ATR_ADDRESS) || '-',
    };
  }, [ctx.header, ctx.genderMap]);

  // 提取完整的病例信息
  const caseInfo = useMemo(() => {
    if (!ctx.header) return null;
    const attrs = ctx.header.teiAttributes || new Map();
    
    return {
      caseNo: attrs.get(ATR_UNK_NO) || '-',
      reportDate: attrs.get(ATR_RPT_DATE) || '-',
      symptomOnsetDate: attrs.get(ATR_SYMPT_DATE) || '-',
      clinicalSymptoms: attrs.get(ATR_UNK_SYMPT) || '-',
      reportOrgName: ctx.header.reportOrgName || '-',
      statusCode: statusCode || '-',
    };
  }, [ctx.header, statusCode]);

  if (!id) return <Empty description="缺少病例ID" />;

  const confirmPush = () => {
    Modal.confirm({
      title: '推送病例至个案管理',
      content: (
        <div>
          <p>确认将以下病例推送至个案管理系统？</p>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="病例编号">{caseInfo?.caseNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="患者姓名">{patientInfo?.fullName || '-'}</Descriptions.Item>
            <Descriptions.Item label="病例状态">{statusCode || '-'}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 12 }}>
            <ul>
              <li>自动创建个案记录（Program 1）</li>
              <li>登记事件标记已推送</li>
              <li>更新病例状态为已确诊</li>
              <li>完成不明病例入组</li>
            </ul>
            <Typography.Text type="danger">注意：推送后不可撤销，请确认信息无误。</Typography.Text>
          </div>
        </div>
      ),
      onOk: async () => {
        setPushing(true);
        setCreatedEnrollment(null);
        const res = await ctx.runPush();
        if (res.ok) {
          setCreatedEnrollment(res.createdEnrollment || null);
          message.success('推送成功');
          await ctx.reload();
        } else {
          message.error(res.error || '推送失败');
        }
        setPushing(false);
      },
    });
  };

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Descriptions title={`病例编号: ${caseInfo?.caseNo || '-'}`} bordered column={2}
            extra={
              <Space>
                <Button type="primary"><Link to={`/unknown-cases/${id}/edit`}>编辑</Link></Button>
                {ctx.canPush && <Button type="primary" danger onClick={confirmPush}>推送至个案管理</Button>}
                <Button><Link to="/unknown-cases">返回列表</Link></Button>
              </Space>
            }
          >
            <Descriptions.Item label="患者姓名">{patientInfo?.fullName || '-'}</Descriptions.Item>
            <Descriptions.Item label="病例状态">
              <Tag color={statusTagColor(statusCode)}>{statusCode || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="报告日期">{caseInfo?.reportDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="症状开始">{caseInfo?.symptomOnsetDate || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card>
          <Tabs activeKey={active} onChange={setActive}>
            <TabPane tab="基本信息" key="1">
              <Descriptions title="患者基本信息" bordered column={2}>
                <Descriptions.Item label="姓名">{patientInfo?.fullName || '-'}</Descriptions.Item>
                <Descriptions.Item label="性别">{patientInfo?.gender || '-'}</Descriptions.Item>
                <Descriptions.Item label="年龄">{patientInfo?.age || '-'}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{patientInfo?.nationalId || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{patientInfo?.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="现住址" span={2}>{patientInfo?.address || '-'}</Descriptions.Item>
              </Descriptions>
              <Descriptions title="病例信息" bordered column={2} style={{ marginTop: 24 }}>
                <Descriptions.Item label="病例编号">{caseInfo?.caseNo || '-'}</Descriptions.Item>
                <Descriptions.Item label="报告机构">{caseInfo?.reportOrgName || '-'}</Descriptions.Item>
                <Descriptions.Item label="报告日期">{caseInfo?.reportDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="症状开始日期">{caseInfo?.symptomOnsetDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="病例状态">
                  <Tag color={statusTagColor(caseInfo?.statusCode)}>{caseInfo?.statusCode || '-'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="临床症状描述" span={2}>
                  {caseInfo?.clinicalSymptoms || '-'}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="检测记录" key="3">
              <List
                dataSource={ctx.labEvents}
                renderItem={(item: any) => {
                  const dv = new Map((item.dataValues || []).map((d: any) => [d.dataElement, String(d.value)]));
                  return (
                    <List.Item>
                      <Card style={{ width: '100%' }} title={`🧪 ${dv.get('DeUnkTstTp1') || '-'} | ${item.occurredAt}`}>
                        <Descriptions column={2}>
                          <Descriptions.Item label="样本类型">{dv.get('DeUnkSmplTp') || '-'}</Descriptions.Item>
                          <Descriptions.Item label="检测结果"><Tag color={String(dv.get('DeUnkTstRst') || '').toUpperCase() === 'POSITIVE' ? 'red' : 'green'}>{dv.get('DeUnkTstRst') || '-'}</Tag></Descriptions.Item>
                          <Descriptions.Item label="病原体" span={2}>{dv.get('DeConfPath1') || 'N/A'}</Descriptions.Item>
                          <Descriptions.Item label="检测机构" span={2}>{'-'}</Descriptions.Item>
                          <Descriptions.Item label="检测状态">{dv.get('DeUnkTstSt1') || '-'}</Descriptions.Item>
                        </Descriptions>
                        <Space style={{ marginTop: 16, float: 'right' }}>
                          <Link to={`/unknown-cases/${id}/test-records/${item.event}/edit`}>编辑</Link>
                        </Space>
                      </Card>
                    </List.Item>
                  );
                }}
                locale={{ emptyText: <Empty description="暂无检测记录" /> }}
              />
            </TabPane>

            <TabPane tab="推送记录" key="4">
              <Button onClick={ctx.loadLogs} style={{ marginBottom: 12 }}>刷新</Button>
              <Descriptions bordered column={1} title="Enrollment 变更日志">
                <Descriptions.Item label="日志">
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(ctx.logs.enr, null, 2)}</pre>
                </Descriptions.Item>
              </Descriptions>
              <Descriptions bordered column={1} title="登记事件变更日志" style={{ marginTop: 16 }}>
                <Descriptions.Item label="日志">
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(ctx.logs.regEvt, null, 2)}</pre>
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <Modal title="正在推送病例..." open={pushing} footer={null} onCancel={() => setPushing(false)}>
        <Steps
          direction="vertical"
          current={ctx.progress.findIndex((s) => s.status !== 'finish')}
          items={ctx.progress.map((s) => ({
            title: s.title,
            status: s.status === 'error' ? 'error' : s.status === 'finish' ? 'finish' : 'process',
            description: s.description,
          }))}
        />
        {createdEnrollment ? (
          <div style={{ marginTop: 12 }}>
            <Typography.Paragraph>
              个案记录创建成功，Enrollment UID: <Typography.Text code>{createdEnrollment}</Typography.Text>
            </Typography.Paragraph>
            <Space>
              <Button type="primary"><Link to={`/cases/${ctx.header?.teiUid}`}>查看个案详情</Link></Button>
              <Button onClick={() => setPushing(false)}>关闭</Button>
            </Space>
          </div>
        ) : null}
      </Modal>
    </>
  );
}