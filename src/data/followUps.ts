export interface FollowUp {
    id: string;
    caseId: string;
    date: string;
    method: '电话随访' | '现场随访' | '线上随访';
    doctor: string;
    healthStatus: '好转' | '稳定' | '异常' | '恶化';
    temperature: string;
    symptoms: string;
    notes: string;
    // New fields from PF-5.2.2
    treatmentCompliance: '良好' | '一般' | '差';
    nextFollowUpDate?: string; // Optional, as per PF-5.2.2
}

export const followUps: FollowUp[] = [
    {
        id: 'fu1',
        caseId: '1',
        date: '2024-01-15',
        method: '电话随访',
        doctor: '李医生',
        healthStatus: '好转',
        temperature: '36.8°C',
        symptoms: '咳嗽减轻，无发热',
        notes: '患者状况良好，继续居家隔离。',
        treatmentCompliance: '良好',
        nextFollowUpDate: '2024-01-18',
    },
    {
        id: 'fu2',
        caseId: '1',
        date: '2024-01-12',
        method: '现场随访',
        doctor: '王护士',
        healthStatus: '异常',
        temperature: '38.2°C',
        symptoms: '发热、咳嗽、乏力',
        notes: '已建议患者及时就医，并开具相应药物。',
        treatmentCompliance: '差',
        nextFollowUpDate: '2024-01-13',
    },
    {
        id: 'fu3',
        caseId: '1',
        date: '2024-01-10',
        method: '电话随访',
        doctor: '李医生',
        healthStatus: '稳定',
        temperature: '37.5°C',
        symptoms: '轻微咳嗽',
        notes: '患者初次随访，情绪稳定。',
        treatmentCompliance: '良好',
        nextFollowUpDate: '2024-01-11',
    },
];