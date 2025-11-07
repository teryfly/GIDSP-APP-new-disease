import { useState } from 'react';
import { Form, Button, Space, message, Card, Typography } from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import LabTestForm from '../../components/forms/LabTestForm';
import NotesInput from '../../components/forms/NotesInput';
import AssignedUserSelect from '../../components/forms/AssignedUserSelect';
import type { LabTestFormData, NoteData } from '../../types/labTest';
import { createLabTestEvent } from '../../services/unknownCase/labTest';

const { Title } = Typography;

const NewLabTest = () => {
  const [form] = Form.useForm<LabTestFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const enrollment = searchParams.get('enrollment') || '';
  const orgUnit = searchParams.get('orgUnit') || '';

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [assignedUser, setAssignedUser] = useState<any>(null);

  const handleSubmit = async () => {
    if (!id || !enrollment) {
      message.error('缺少必要参数');
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        enrollment,
        trackedEntity: id,
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
            uid: assignedUser.id,
            displayName: assignedUser.displayName,
            username: assignedUser.username,
            firstName: assignedUser.firstName,
            surname: assignedUser.surname,
          },
        }),
        ...(notes.length > 0 && { notes: notes.map((n) => ({ value: n.value })) }),
      };

      const result = await createLabTestEvent(payload);

      if (result.status === 'OK' || result.status === 'SUCCESS') {
        message.success('检测记录创建成功！');
        navigate(`/unknown-cases/${id}`);
      } else {
        message.error('创建失败，请检查数据');
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>新增检测记录</Title>
      </Card>

      <LabTestForm form={form} mode="create" defaultOrgUnit={orgUnit} />

      <NotesInput notes={notes} onChange={setNotes} />

      <Card title="分配者">
        <AssignedUserSelect
          value={assignedUser?.id}
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

export default NewLabTest;