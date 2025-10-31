export interface UnknownCase {
    id: string;
    caseNo: string;
    patientName: string;
    reportDate: string;
    status: '待检测' | '检测中' | '已确诊' | '已排除' | '已推送';
    urgency: '高' | '中' | '低';
    gender: '男' | '女';
    age: number;
    symptoms: string;
    confirmedDisease?: string;
}

export const unknownCases: UnknownCase[] = [
    {
        id: '1',
        caseNo: 'UNK-2024-023',
        patientName: '张三',
        reportDate: '2024-01-15',
        status: '待检测',
        urgency: '高',
        gender: '男',
        age: 45,
        symptoms: '持续高烧、呼吸困难、原因不明'
    },
    {
        id: '2',
        caseNo: 'UNK-2024-022',
        patientName: '李四',
        reportDate: '2024-01-14',
        status: '检测中',
        urgency: '中',
        gender: '女',
        age: 32,
        symptoms: '神经系统症状、间歇性抽搐'
    },
    {
        id: '3',
        caseNo: 'UNK-2024-021',
        patientName: '王五',
        reportDate: '2024-01-13',
        status: '已确诊',
        urgency: '中',
        gender: '男',
        age: 38,
        symptoms: '发热、干咳、乏力',
        confirmedDisease: '新冠肺炎'
    },
    {
        id: '4',
        caseNo: 'UNK-2024-020',
        patientName: '赵六',
        reportDate: '2024-01-12',
        status: '已推送',
        urgency: '高',
        gender: '男',
        age: 28,
        symptoms: '严重腹泻、脱水、呕吐',
        confirmedDisease: '霍乱'
    },
    {
        id: '5',
        caseNo: 'UNK-2024-019',
        patientName: '孙七',
        reportDate: '2024-01-11',
        status: '已排除',
        urgency: '低',
        gender: '女',
        age: 65,
        symptoms: '普通流感症状',
        confirmedDisease: '甲型流感'
    }
]