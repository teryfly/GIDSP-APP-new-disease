import dayjs from 'dayjs';

/**
 * 检测记录表单数据
 */
export interface LabTestFormData {
  occurredAt: dayjs.Dayjs; // Report date
  scheduledAt?: dayjs.Dayjs; // Scheduled date
  orgUnit: string; // Organisation unit
  testType: string; // 检测类型-2
  sampleCollectionDate: dayjs.Dayjs; // 样本采集日期-2
  testStatus: string; // 检测状态-2
  confirmedDiseaseName?: string; // 确诊疾病名称
  testDate?: dayjs.Dayjs; // 检测日期-2
  testResult?: string; // 检测结果-2
  testNo: string; // 检测编号-2
  labReportUrl?: string; // 实验室报告URL-2
  testOrgName?: string; // 检测机构-2
  confirmedPathogen?: string; // 确认的病原体
  sampleType: string; // 样本类型-2
  resultDetails?: string; // 结果详情-2
  completeEvent: boolean; // Complete event
  assignedUserId?: string; // 分配者ID
}

/**
 * 笔记数据
 */
export interface NoteData {
  id: string;
  value: string;
  createdBy: string;
}