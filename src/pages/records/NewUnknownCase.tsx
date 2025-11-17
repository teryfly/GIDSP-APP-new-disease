import { useState } from 'react';
import { Form, Button, Space, message, Steps } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import UnknownCaseStepOneForm, { type StepOneFormData } from '../../components/forms/UnknownCaseStepOneForm';
import UnknownCaseStepTwoForm, { type StepTwoFormData } from '../../components/forms/UnknownCaseStepTwoForm';
import {
  generateTeiUid,
  generateUnknownCaseNo,
  createPersonWithEnrollment,
  updateRegisterEvent,
} from '../../services/unknownCase/create';

const NewUnknownCase = () => {
  const [formOne] = Form.useForm<StepOneFormData>();
  const [formTwo] = Form.useForm<StepTwoFormData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgUnit = searchParams.get('orgUnit') || ''; // 从列表页传入的报告单位

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [createdData, setCreatedData] = useState<{
    trackedEntity: string;
    enrollment: string;
    event: string;
    caseNo: string;
  } | null>(null);

  const handleStepOne = async () => {
    try {
      const values = await formOne.validateFields();
      setSubmitting(true);

      // 在提交时才生成 TEI UID 和不明病例编号
      const [trackedEntity, caseNo] = await Promise.all([
        generateTeiUid(),
        generateUnknownCaseNo(),
      ]);

      // 更新表单显示生成的编号
      formOne.setFieldsValue({ caseNo });

      // 转换日期格式
      const enrolledAt = dayjs(values.enrolledAt).format('YYYY-MM-DD');
      const symptomDate = dayjs(values.symptomDate).format('YYYY-MM-DD');
      const reportDate = dayjs(values.reportDate).format('YYYY-MM-DD');

      // 创建 Person 及 Enrollment
      const result = await createPersonWithEnrollment({
        trackedEntity,
        orgUnit,
        caseNo,
        fullName: values.fullName,
        nationalId: values.nationalId,
        gender: values.gender,
        age: values.age,
        phone: values.phone,
        address: values.address,
        reportOrg: values.reportOrg,
        reportDate,
        symptomDate,
        clinicalSymptoms: values.clinicalSymptoms,
        suspectedPathogen: values.suspectedPathogen,
        enrolledAt,
      });

      // 检查响应状态
      if (result.status === 'ERROR') {
        const errorMessages = result.validationReport?.errorReports?.map((err: any) => err.message).join('; ') || '创建失败';
        throw new Error(errorMessages);
      }

      if (result.status === 'OK' || result.status === 'SUCCESS') {
        // 提取创建的 enrollment 和 event UID
        const enrollment = result.bundleReport?.typeReportMap?.ENROLLMENT?.objectReports?.[0]?.uid;
        const event = result.bundleReport?.typeReportMap?.EVENT?.objectReports?.[0]?.uid;

        if (!enrollment || !event) {
          throw new Error('创建失败：未能获取 enrollment 或 event UID');
        }

        setCreatedData({ trackedEntity, enrollment, event, caseNo });
        message.success(`第一步完成，病例编号：${caseNo}`);
        setCurrentStep(1);
      } else {
        message.error('创建失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项');
      console.error('Step one error:', errorInfo);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepTwo = async () => {
    if (!createdData) {
      message.error('缺少第一步创建的数据');
      return;
    }

    try {
      const values = await formTwo.validateFields();
      setSubmitting(true);

      // 合并日期和时间的辅助函数
      const combineDateTime = (date?: dayjs.Dayjs, time?: string): string | undefined => {
        if (!date || !time) return undefined;
        // 解析时间字符串 (HH:mm)
        const [hours, minutes] = time.split(':').map(Number);
        return date.hour(hours).minute(minutes).second(0).millisecond(0).toISOString();
      };

      // 转换日期时间格式
      const occurredAt = dayjs(values.occurredAt).format('YYYY-MM-DD');
      const scheduledAt = dayjs(values.scheduledAt).format('YYYY-MM-DD');

      const emergencyTime = values.emergencyDate && values.emergencyTime
        ? `${dayjs(values.emergencyDate).format('YYYY-MM-DD')}T${values.emergencyTime}:00.000Z`
        : undefined;

      const pushCaseTime = values.pushCaseDate && values.pushCaseTime
        ? `${dayjs(values.pushCaseDate).format('YYYY-MM-DD')}T${values.pushCaseTime}:00.000Z`
        : undefined;

      const pushEpiTime = values.pushEpiDate && values.pushEpiTime
        ? `${dayjs(values.pushEpiDate).format('YYYY-MM-DD')}T${values.pushEpiTime}:00.000Z`
        : undefined;

      // 合并预警时间
      const alertTime = values.pushedToEmergency 
        ? combineDateTime(values.alertDateTime, values.alertTime) 
        : undefined;

      // 更新登记事件
      const result = await updateRegisterEvent({
        event: createdData.event,
        enrollment: createdData.enrollment,
        trackedEntity: createdData.trackedEntity,
        orgUnit,
        occurredAt,
        scheduledAt,
        pushedToCase: values.pushedToCase,
        pushedToEpi: values.pushedToEpi,
        pushedCaseId: values.pushedCaseId,
        pushedToEmergency: values.pushedToEmergency, // 直接传递数字值
        emergencyTime,
        pushCaseTime,
        pushEpiTime,
        status: values.status,
        completeEvent: values.completeEvent,
        
        // 新增属性（仅当pushedToEmergency为1时传递）
        alertId: values.pushedToEmergency === 1 ? values.alertId : undefined,
        alertTitle: values.pushedToEmergency === 1 ? values.alertTitle : undefined,
        alertContent: values.pushedToEmergency === 1 ? values.alertContent : undefined,
        alertTypeName: values.pushedToEmergency === 1 ? values.alertTypeName : undefined,
        alertSource: values.pushedToEmergency === 1 ? values.alertSource : undefined,
        alertTime: values.pushedToEmergency === 1 ? alertTime : undefined,
        alertEventId: values.pushedToEmergency === 1 ? values.alertEventId : undefined,
        alertModifyType: values.pushedToEmergency === 1 ? values.alertModifyType : undefined,
        alertStatus: values.pushedToEmergency === 1 ? values.alertStatus : undefined,
      });

      // 检查响应状态
      if (result.status === 'ERROR') {
        const errorMessages = result.validationReport?.errorReports?.map((err: any) => err.message).join('; ') || '更新失败';
        throw new Error(errorMessages);
      }

      if (result.status === 'OK' || result.status === 'SUCCESS') {
        message.success(`不明原因病例创建成功！病例编号：${createdData.caseNo}`);
        navigate('/unknown-cases');
      } else {
        message.error('更新失败，请检查数据');
        console.error('Import result:', result);
      }
    } catch (errorInfo: any) {
      message.error(errorInfo.message || '请检查表单填写项');
      console.error('Step two error:', errorInfo);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/unknown-cases');
  };

  const handlePrevious = () => {
    setCurrentStep(0);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Steps
        current={currentStep}
        items={[
          { title: '基本信息', description: '填写患者基本信息' },
          { title: '病例登记', description: '完成不明病例登记' },
        ]}
      />

      {currentStep === 0 && <UnknownCaseStepOneForm form={formOne} orgUnit={orgUnit} />}
      {currentStep === 1 && <UnknownCaseStepTwoForm form={formTwo} orgUnit={orgUnit} />}

      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          {currentStep === 1 && (
            <Button onClick={handlePrevious} disabled={submitting}>
              上一步
            </Button>
          )}
          <Button onClick={handleCancel} disabled={submitting}>
            取消
          </Button>
          {currentStep === 0 && (
            <Button type="primary" onClick={handleStepOne} loading={submitting}>
              下一步
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="primary" onClick={handleStepTwo} loading={submitting}>
              完成
            </Button>
          )}
        </Space>
      </div>
    </Space>
  );
};

export default NewUnknownCase;