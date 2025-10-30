export interface DiseaseCode {
    id: string;
    diseaseName: string;
    diseaseCode: string;
    icd10: string;
    category: '甲类' | '乙类' | '丙类' | '其他';
    riskLevel: '高' | '中' | '低';
}

export const diseaseCodes: DiseaseCode[] = [
    {
        id: '1',
        diseaseName: '鼠疫',
        diseaseCode: 'D001',
        icd10: 'A20',
        category: '甲类',
        riskLevel: '高'
    },
    {
        id: '2',
        diseaseName: '霍乱',
        diseaseCode: 'D002',
        icd10: 'A00',
        category: '甲类',
        riskLevel: '高'
    },
    {
        id: '3',
        diseaseName: '新冠肺炎',
        diseaseCode: 'D003',
        icd10: 'U07.1',
        category: '乙类',
        riskLevel: '中'
    },
    {
        id: '4',
        diseaseName: '艾滋病',
        diseaseCode: 'D004',
        icd10: 'B20-B24',
        category: '乙类',
        riskLevel: '中'
    },
    {
        id: '5',
        diseaseName: '流行性感冒',
        diseaseCode: 'D005',
        icd10: 'J10-J11',
        category: '丙类',
        riskLevel: '低'
    },
     {
        id: '6',
        diseaseName: '手足口病',
        diseaseCode: 'D006',
        icd10: 'B08.4',
        category: '丙类',
        riskLevel: '低'
    },
];