export interface Treatment {
    id: string;
    caseId: string;
    date: string;
    type: '门诊' | '住院' | '居家隔离';
    hospital: string;
    diagnosis: string;
    plan: string;
    outcome: '治愈' | '好转' | '无效' | '死亡' | '转院';
    // New field from PF-5.2.2
    dischargeDate?: string; // Only applicable for '住院' type
}

export const treatments: Treatment[] = [
    {
        id: 'tr1',
        caseId: '1',
        date: '2024-01-12',
        type: '住院',
        hospital: '北京市地坛医院',
        diagnosis: '新冠肺炎（普通型）',
        plan: '抗病毒治疗，对症支持治疗。',
        outcome: '好转',
        dischargeDate: '2024-01-20', // Example discharge date
    },
    {
        id: 'tr2',
        caseId: '2',
        date: '2024-01-15',
        type: '住院',
        hospital: '广州市第八人民医院',
        diagnosis: '霍乱',
        plan: '液体复苏，抗生素治疗。',
        outcome: '好转',
        dischargeDate: '2024-01-22', // Example discharge date
    },
    {
        id: 'tr3',
        caseId: '1',
        date: '2024-01-05',
        type: '门诊',
        hospital: '北京市朝阳医院',
        diagnosis: '普通感冒',
        plan: '对症治疗，多休息。',
        outcome: '治愈',
        // No dischargeDate for outpatient
    },
];