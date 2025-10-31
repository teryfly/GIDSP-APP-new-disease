export interface TestRecord {
    id: string;
    caseId?: string; // Made optional
    unknownCaseId?: string; // Added for unknown cases
    collectionTime: string;
    sampleType: '咽拭子' | '血液' | '粪便' | '尿液';
    testType: '核酸检测' | '抗体检测' | '培养' | '影像学';
    result: '阳性' | '阴性' | '待定';
    pathogen?: string;
    lab: string;
    // New fields from PF-5.2.2
    testStatus: '待确认' | '已确认';
    isPushedToLab: boolean; // Indicates if the test request was pushed to a lab system
}

export const testRecords: TestRecord[] = [
    {
        id: 'test1',
        caseId: '1',
        collectionTime: '2024-01-14 09:00',
        sampleType: '咽拭子',
        testType: '核酸检测',
        result: '阳性',
        pathogen: '新型冠状病毒 (SARS-CoV-2)',
        lab: '北京市疾控中心实验室',
        testStatus: '已确认',
        isPushedToLab: true,
    },
    {
        id: 'test2',
        caseId: '1',
        collectionTime: '2024-01-14 09:05',
        sampleType: '血液',
        testType: '抗体检测',
        result: '阳性',
        pathogen: '新型冠状病毒 (IgM)',
        lab: '北京市疾控中心实验室',
        testStatus: '已确认',
        isPushedToLab: true,
    },
    {
        id: 'test3',
        caseId: '1',
        collectionTime: '2024-01-13 14:30',
        sampleType: '咽拭子',
        testType: '核酸检测',
        result: '待定',
        lab: '北京市第三方检测机构',
        testStatus: '待确认',
        isPushedToLab: false,
    },
    {
        id: 'test_unk1',
        unknownCaseId: '1', // Linked to unknown case 1
        collectionTime: '2024-01-16 10:00',
        sampleType: '血液',
        testType: '核酸检测',
        result: '待定',
        lab: '上海市疾控中心实验室',
        testStatus: '待确认',
        isPushedToLab: false,
    },
    {
        id: 'test_unk2',
        unknownCaseId: '2', // Linked to unknown case 2
        collectionTime: '2024-01-15 11:30',
        sampleType: '咽拭子',
        testType: '培养',
        result: '待定',
        lab: '上海市第三方检测机构',
        testStatus: '检测中',
        isPushedToLab: true,
    },
];