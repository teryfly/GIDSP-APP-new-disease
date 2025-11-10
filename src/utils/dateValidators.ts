import dayjs, { Dayjs } from 'dayjs';

/**
 * 将表单值转换为 dayjs 对象
 * 支持 Dayjs 对象、字符串、null、undefined
 */
export function toDayjs(value: any): Dayjs | null {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  const d = dayjs(value);
  return d.isValid() ? d : null;
}

/**
 * 验证日期不能晚于今天
 */
export function validateNotFuture(_: any, value: any): Promise<void> {
  const date = toDayjs(value);
  if (!date) return Promise.resolve();
  const today = dayjs().endOf('day');
  if (date.isAfter(today)) {
    return Promise.reject(new Error('日期不能晚于今天'));
  }
  return Promise.resolve();
}

/**
 * 验证日期时间不能晚于当前时间
 */
export function validateNotFutureDateTime(_: any, value: any): Promise<void> {
  const date = toDayjs(value);
  if (!date) return Promise.resolve();
  const now = dayjs();
  if (date.isAfter(now)) {
    return Promise.reject(new Error('时间不能晚于当前时间'));
  }
  return Promise.resolve();
}

/**
 * 验证日期不能早于指定日期
 */
export function validateNotBefore(beforeDate: any, errorMsg: string) {
  return (_: any, value: any): Promise<void> => {
    const date = toDayjs(value);
    const before = toDayjs(beforeDate);
    if (!date || !before) return Promise.resolve();
    if (date.isBefore(before, 'day')) {
      return Promise.reject(new Error(errorMsg));
    }
    return Promise.resolve();
  };
}

/**
 * 验证日期不能晚于指定日期
 */
export function validateNotAfter(afterDate: any, errorMsg: string) {
  return (_: any, value: any): Promise<void> => {
    const date = toDayjs(value);
    const after = toDayjs(afterDate);
    if (!date || !after) return Promise.resolve();
    if (date.isAfter(after, 'day')) {
      return Promise.reject(new Error(errorMsg));
    }
    return Promise.resolve();
  };
}

/**
 * 验证结束日期不早于开始日期
 */
export function validateDateRange(getStartDate: () => any, errorMsg: string = '结束日期不能早于开始日期') {
  return (_: any, value: any): Promise<void> => {
    const endDate = toDayjs(value);
    const startDate = toDayjs(getStartDate());
    if (!endDate || !startDate) return Promise.resolve();
    if (endDate.isBefore(startDate, 'day')) {
      return Promise.reject(new Error(errorMsg));
    }
    return Promise.resolve();
  };
}

/**
 * 验证症状开始日期
 * 1. 不能晚于今天
 * 2. 不能晚于报告日期
 */
export function validateSymptomOnsetDate(getReportDate: () => any) {
  return (_: any, value: any): Promise<void> => {
    const symptomDate = toDayjs(value);
    if (!symptomDate) return Promise.resolve();
    // 不能晚于今天
    const today = dayjs().endOf('day');
    if (symptomDate.isAfter(today)) {
      return Promise.reject(new Error('症状开始日期不能晚于今天'));
    }
    // 不能晚于报告日期
    const reportDate = toDayjs(getReportDate());
    if (reportDate && symptomDate.isAfter(reportDate, 'day')) {
      return Promise.reject(new Error('症状开始日期不能晚于报告日期'));
    }
    return Promise.resolve();
  };
}