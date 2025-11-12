import { useEffect, useState } from 'react';
import { Form, Button, Space, message, Spin, Card, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import LabTestForm from '../../components/forms/LabTestForm';
import NotesInput from '../../components/forms/NotesInput';
import AssignedUserSelect from '../../components/forms/AssignedUserSelect';
import type { LabTestFormData, NoteData } from '../../types/labTest';
import { getLabTestEventDetail, updateLabTestEvent } from '../../services/unknownCase/labTest';

const { Title } = Typography;

const EditLabTest = () => {
  const [form] = Form.useForm<LabTestFormData>();
  const navigate = useNavigate();
  const { id, eventId } = useParams<{ id: string; eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [assignedUser, setAssignedUser] = useState<any>(null);

  useEffect(() => {
    if (id && eventId) {
      loadEventData();
    }
  }, [id, eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const event = await getLabTestEventDetail(eventId!);
      setEventData(event);

      const dvMap = new Map(event.dataValues.map((dv: any) => [dv.dataElement, dv.value]));

      // 设置表单值
      form.setFieldsValue({
        occurredAt: event.occurredAt ? dayjs(event.occurredAt) : dayjs(),
        scheduledAt: event.scheduledAt ? dayjs(event.scheduledAt) : undefined,
        orgUnit: event.orgUnit || '',
        testType: dvMap.get('DeUnkTstTp1') || '',
        sampleCollectionDate: dvMap.get('DeUnkSmplDt') ? dayjs(dvMap.get('DeUnkSmplDt')) : dayjs(),
        testStatus: dvMap.get('DeUnkTstSt1') || '',
        confirmedDiseaseName: dvMap.get('DeConfDis01') || '',
        testDate: dvMap.get('DeUnkTstDt1') ? dayjs(dvMap.get('DeUnkTstDt1')) : undefined,
        testResult: dvMap.get('DeUnkTstRst') || '',
        testNo: dvMap.get('DeUnkTstNo1') || '',
        labReportUrl: dvMap.get('DeUnkLabUrl') || '',
        testOrgName: dvMap.get('DeUnkTstOrg') || '',
        confirmedPathogen: dvMap.get('DeConfPath1') || '',
        sampleType: dvMap.get('DeUnkSmplTp') || '',
        resultDetails: dvMap.get('DeUnkRstDtl') || '',
        completeEvent: event.status === 'COMPLETED',
      });

      // 设置笔记
      if (event.notes && event.notes.length > 0) {
        setNotes(
          event.notes.map((note: any) => ({
            id: note.note,
            value: note.value,
            createdBy: note.createdBy?.displayName || 'Unknown',
          }))
        );
      }

      // 设置分配者
      if (event.assignedUser) {
        setAssignedUser(event.assignedUser);
      }
    } catch (e: any) {
      message.error(`加载数据失败: ${e.message}`);
      navigate(`/unknown-cases/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventData) {
      message.error('缺少必要数据');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        event: eventData.event,
        enrollment: eventData.enrollment,
        trackedEntity: eventData.trackedEntity,
        orgUnit: values.orgUnit,
        occurredAt: values.occurredAt.format('YYYY-MM-DD'),
        scheduledAt: values.scheduledAt?.format('YYYY-MM-DD'),
        testType: values.testType,
        sampleCollectionDate: values.sampleCollectionDate.format('YYYY-MM-DD'),
        testStatus: values.testStatus,
        confirmedDiseaseName: values.confirmedDiseaseName,
        testDate: values.testDate?.format('YYYY-MM-DD'),
        testResult: values.testResult,
        testNo: values.testNo,
        labReportUrl: values.labReportUrl,
        testOrgName: values.testOrgName,
        confirmedPathogen: values.confirmedPathogen,
        sampleType: values.sampleType,
        resultDetails: values.resultDetails,
        completeEvent: values.completeEvent || false,
        ...(assignedUser && {
          assignedUser: {
            uid: assignedUser.id || assignedUser.uid,
            displayName: assignedUser.displayName,
            username: assignedUser.username,
            firstName: assignedUser.firstName,
            surname: assignedUser.surname,
          },
        }),
        ...(notes.length > 0 && { notes: notes.map((n) => ({ value: n.value })) }),
      };

      const result = await updateLabTestEvent(payload);

      if (result.status === 'OK' || result.status === 'SUCCESS') {
        message.success('检测记录更新成功！');
        navigate(`/unknown-cases/${id}`);
      } else {
        message.error('更新失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/unknown-cases/${id}`);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>编辑检测记录</Title>
      </Card>

      <LabTestForm
        form={form}
        mode="edit"
        initialValues={form.getFieldsValue()}
      />

      <NotesInput notes={notes} onChange={setNotes} />

      <Card title="分配者">
        <AssignedUserSelect
          value={assignedUser?.uid || assignedUser?.id}
          onChange={(userId, user) => setAssignedUser(user)}
        />
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            保存
          </Button>
        </Space>
      </div>
    </Space>
  );
};

export default EditLabTest;