export interface TrackingRecord {
    id: string;
    caseId: string;
    date: string; // This will now represent the record creation date or a key date for the event
    type: '旅居史' | '接触史' | '场所暴露史';
    location: string;
    lat: number;
    lng: number;
    description: string;
    // New fields from PF-5.2.2
    startDate: string;
    endDate: string;
    riskAssessment: '高风险' | '中风险' | '低风险';
    isPushedToEpi: boolean; // Indicates if the record was pushed to an epidemiological investigation system
}

export const trackingRecords: TrackingRecord[] = [
    {
        id: 'track1',
        caseId: '1',
        date: '2024-01-08', // Record creation date or main event date
        type: '场所暴露史',
        location: '北京市朝阳区三里屯太古里',
        lat: 39.9343,
        lng: 116.4554,
        description: '与朋友聚餐，停留约2小时。',
        startDate: '2024-01-08',
        endDate: '2024-01-08',
        riskAssessment: '中风险',
        isPushedToEpi: true,
    },
    {
        id: 'track2',
        caseId: '1',
        date: '2024-01-09',
        type: '旅居史',
        location: '北京市大兴国际机场',
        lat: 39.509,
        lng: 116.410,
        description: '乘坐CA1234航班前往上海。',
        startDate: '2024-01-09',
        endDate: '2024-01-09',
        riskAssessment: '高风险',
        isPushedToEpi: true,
    },
    {
        id: 'track3',
        caseId: '1',
        date: '2024-01-10',
        type: '场所暴露史',
        location: '上海市外滩',
        lat: 31.239,
        lng: 121.499,
        description: '在外滩观光，停留约3小时。',
        startDate: '2024-01-10',
        endDate: '2024-01-10',
        riskAssessment: '中风险',
        isPushedToEpi: false,
    },
    {
        id: 'track4',
        caseId: '1',
        date: '2024-01-05',
        type: '接触史',
        location: '北京市某小区',
        lat: 39.9042,
        lng: 116.4074,
        description: '与确诊病例李某有密切接触。',
        startDate: '2024-01-05',
        endDate: '2024-01-05',
        riskAssessment: '高风险',
        isPushedToEpi: true,
    },
];