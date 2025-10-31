export interface Alert {
    id: string;
    alertNo: string;
    type: string;
    location: string;
    detectionTime: string;
    level: '一级' | '二级' | '三级' | '四级';
    status: '待处理' | '处理中' | '已核实' | '误报';
    relatedCases: number;
    triggerRule: string;
    summary: string;
}

export const alerts: Alert[] = [
    {
        id: '1',
        alertNo: 'ALT-2024-012',
        type: '病例聚集',
        location: '北京市朝阳区',
        detectionTime: '2024-01-15 10:30',
        level: '一级',
        status: '待处理',
        relatedCases: 5,
        triggerRule: '7天内同地区同疾病>5例',
        summary: '朝阳区XX街道近7天内发现5例新冠肺炎确诊病例，存在社区传播风险。'
    },
    {
        id: '2',
        alertNo: 'ALT-2024-011',
        type: '异常症状',
        location: '上海市浦东区',
        detectionTime: '2024-01-14 15:20',
        level: '二级',
        status: '处理中',
        relatedCases: 3,
        triggerRule: '出现异常症状聚集',
        summary: '浦东区发现3例患者出现相似异常神经系统症状，疑似新型病毒感染。'
    },
    {
        id: '3',
        alertNo: 'ALT-2024-010',
        type: '新发疾病',
        location: '广东省深圳市',
        detectionTime: '2024-01-13 09:45',
        level: '一级',
        status: '已核实',
        relatedCases: 2,
        triggerRule: '检测到新发疾病',
        summary: '深圳市发现2例不明原因肺炎，已确诊为新型冠状病毒变种。'
    },
    {
        id: '4',
        alertNo: 'ALT-2024-009',
        type: '病例聚集',
        location: '浙江省杭州市',
        detectionTime: '2024-01-12 14:10',
        level: '三级',
        status: '误报',
        relatedCases: 4,
        triggerRule: '7天内同地区同疾病>3例',
        summary: '经核实为重复报告，非真实病例聚集。'
    }
]