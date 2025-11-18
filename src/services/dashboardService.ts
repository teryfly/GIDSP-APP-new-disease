import { dhis2Client } from '../api/dhis2Client';

// 获取当前年月格式 YYYYMM
const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

// 获取上个月年月格式 YYYYMM
const getLastYearMonth = () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

// 处理中个案统计
export async function getProcessingCasesCount(orgUnit: string = 'OuSichuan10') {
  const currentYearMonth = getCurrentYearMonth();
  const path = '/api/42/analytics';
  const params = {
    dimension: `dx:QZXMhcgAQgt,pe:${currentYearMonth}`,
    filter: `ou:${orgUnit}`,
    displayProperty: 'NAME',
    includeNumDen: 'false',
    skipMeta: 'true',
    skipData: 'false'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    // rows数组的长度即为处理中个案的数量
    return response.rows ? response.rows.length : 0;
  } catch (error) {
    console.error('获取处理中个案数据失败:', error);
    return 0;
  }
}

// 已核实个案统计
export async function getVerifiedCasesCount(orgUnit: string = 'OuSichuan10') {
  const currentYearMonth = getCurrentYearMonth();
  const path = '/api/42/analytics';
  const params = {
    dimension: `dx:GMGUOntCvid,pe:${currentYearMonth}`,
    filter: `ou:${orgUnit}`,
    displayProperty: 'NAME',
    includeNumDen: 'false',
    skipMeta: 'true',
    skipData: 'false'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    // rows数组的长度即为已核实个案的数量
    return response.rows ? response.rows.length : 0;
  } catch (error) {
    console.error('获取已核实个案数据失败:', error);
    return 0;
  }
}

// 本月新增个案统计
export async function getNewCasesCount(orgUnit: string = 'OuSichuan10') {
  const currentYearMonth = getCurrentYearMonth();
  const lastYearMonth = getLastYearMonth();
  const path = '/api/42/analytics';
  const params = {
    dimension: `dx:A6d4V1vrqnP,pe:${lastYearMonth};${currentYearMonth}`,
    filter: `ou:${orgUnit}`,
    displayProperty: 'NAME',
    includeNumDen: 'false',
    skipMeta: 'true',
    skipData: 'false'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    
    if (!response.rows || response.rows.length === 0) {
      return { count: 0, trend: 0 };
    }

    // 统计本月和上个月的数量
    let lastMonthCount = 0;
    let currentMonthCount = 0;

    response.rows.forEach((row: any) => {
      if (row[1] === lastYearMonth) {
        lastMonthCount += parseFloat(row[2]) || 0;
      } else if (row[1] === currentYearMonth) {
        currentMonthCount += parseFloat(row[2]) || 0;
      }
    });

    // 计算增长趋势百分比
    let trend = 0;
    if (lastMonthCount > 0) {
      trend = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    } else if (currentMonthCount > 0) {
      // 如果上个月为0，本月有数据，则增长100%
      trend = 100;
    } 

    return { count: Math.round(currentMonthCount), trend };
  } catch (error) {
    console.error('获取本月新增个案数据失败:', error);
    return { count: 0, trend: 0 };
  }
}

// 本月预警事件统计
export async function getAlertEventsCount(orgUnit: string = 'OuSichuan10') {
  const currentYearMonth = getCurrentYearMonth();
  const path = '/api/42/analytics';
  const params = {
    dimension: `dx:TxTHLGnndT7,pe:${currentYearMonth}`,
    filter: `ou:${orgUnit}`,
    displayProperty: 'NAME',
    includeNumDen: 'true',
    skipMeta: 'true',
    skipData: 'false'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    // rows数组的长度即为本月预警事件的数量
    return response.rows ? response.rows.length : 0;
  } catch (error) {
    console.error('获取本月预警事件数据失败:', error);
    return 0;
  }
}

// 获取已核实个案待办事项数据
export async function getVerifiedCasesTodo() {
  const path = '/api/tracker/events';
  const params = {
    filter: 'DeCaseStat1:eq:VERIFIED',
    fields: 'trackedEntity,event'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    return response.events || [];
  } catch (error) {
    console.error('获取已核实个案待办数据失败:', error);
    return [];
  }
}

// 获取待确认检测待办事项数据
export async function getPendingConfirmationTestsTodo() {
  const path = '/api/tracker/events';
  const params = {
    filter: 'DeUnkTstSt1:eq:PENDING_CONFIRMATION',
    fields: 'trackedEntity,event'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    return response.events || [];
  } catch (error) {
    console.error('获取待确认检测待办数据失败:', error);
    return [];
  }
}

// 获取待处理预警数据
export async function getPendingAlertsTodo() {
  const path = '/api/42/tracker/events';
  const params = {
    programStage: 'PsRegister1',
    filter: ['DePushEmg01:eq:1', 'YAhyASn12MH:eq:1']
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    return response.events || [];
  } catch (error) {
    console.error('获取待处理预警数据失败:', error);
    return [];
  }
}

// 获取跟踪实体详细信息
export async function getTrackedEntityDetails(trackedEntityId: string) {
  const path = `/api/42/tracker/trackedEntities/${trackedEntityId}`;
  const params = {
    fields: 'enrollments'
  };

  try {
    const response: any = await dhis2Client.get(path, params);
    return response;
  } catch (error) {
    console.error(`获取跟踪实体${trackedEntityId}详细信息失败:`, error);
    return null;
  }
}

export default {
  getProcessingCasesCount,
  getVerifiedCasesCount,
  getNewCasesCount,
  getAlertEventsCount,
  getVerifiedCasesTodo,
  getPendingConfirmationTestsTodo
};