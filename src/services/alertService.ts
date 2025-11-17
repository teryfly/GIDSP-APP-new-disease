import { dhis2Client } from '../api/dhis2Client';

export interface AlertData {
  id: string;
  alertNo: string;
  type: string;
  location: string;
  detectionTime: string;
  level: string;
  status: string;
  summary: string;
  event?: string;
}

// 获取预警列表数据
export async function getAlertEvents(): Promise<{ alerts: AlertData[]; modifyTypeOptions: { value: string; label: string }[]; alertStatusOptions: { value: string; label: string }[] }> {
  try {
    // 定义固定的选项集
    const modifyTypeOptions = [
      { value: '0', label: '默认' },
      { value: '1', label: '添加' },
      { value: '2', label: '修改' }
    ];
    
    const alertStatusOptions = [
      { value: '1', label: '预警中' },
      { value: '2', label: '已结束' }
    ];
    
    // 创建选项集映射
    const modifyTypeMap: Record<string, string> = {};
    modifyTypeOptions.forEach(option => {
      modifyTypeMap[option.value] = option.label;
    });
    
    const alertStatusMap: Record<string, string> = {};
    alertStatusOptions.forEach(option => {
      alertStatusMap[option.value] = option.label;
    });

    const response: any = await dhis2Client.get('/api/42/tracker/events', {
      programStage: 'PsRegister1',
      filter: 'DePushEmg01:eq:1'
    });

    // 映射数据元素ID到字段名称
    const dataElementMap: Record<string, keyof AlertData> = {
      'a4N9z9gZaJc': 'id',           // 预警ID
      'rG1gIAVrgKK': 'alertNo',      // 标题
      'liKIghiuKTt': 'type',         // 预警类型名称
      'm9Pa8zeSCNG': 'location',     // 来源
      'O5kMFPyrkmj': 'detectionTime', // 预警时间
      'wOlEjbF6Ija': 'level',        // 添加或修改类型
      'YAhyASn12MH': 'status',       // 预警状态
      'pjYdGWLER7d': 'summary'       // 内容
    };

    // 处理返回的数据
    const events = response.events || [];
    const alerts: AlertData[] = events.map((event: any) => {
      const alert: Partial<AlertData> = {
        event: event.event
      };

      // 从dataValues中提取字段值
      if (event.dataValues && Array.isArray(event.dataValues)) {
        event.dataValues.forEach((dataValue: any) => {
          const field = dataElementMap[dataValue.dataElement];
          if (field) {
            alert[field] = dataValue.value;
          }
        });
      }

      // 将level和status的值转换为对应的名称
      let levelName = alert.level || '';
      let statusName = alert.status || '';
      
      if (levelName && modifyTypeMap[levelName]) {
        levelName = modifyTypeMap[levelName];
      }
      
      if (statusName && alertStatusMap[statusName]) {
        statusName = alertStatusMap[statusName];
      }

      return {
        id: alert.id || '',
        alertNo: alert.alertNo || '',
        type: alert.type || '',
        location: alert.location || '',
        detectionTime: alert.detectionTime || '',
        level: levelName,
        status: statusName,
        summary: alert.summary || '',
        event: alert.event
      };
    });

    return { alerts, modifyTypeOptions, alertStatusOptions };
  } catch (error) {
    console.error('获取预警事件数据失败:', error);
    return { alerts: [], modifyTypeOptions: [], alertStatusOptions: [] };
  }
}