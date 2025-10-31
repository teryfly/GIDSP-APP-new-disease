export interface Pathogen {
    id: string;
    name: string;
    code: string;
    scientificName: string;
    type: '病毒' | '细菌' | '真菌' | '寄生虫';
    bsl: 'BSL-1' | 'BSL-2' | 'BSL-3' | 'BSL-4';
}

export const pathogens: Pathogen[] = [
    {
        id: 'p1',
        name: '新型冠状病毒',
        code: 'P001',
        scientificName: 'SARS-CoV-2',
        type: '病毒',
        bsl: 'BSL-3',
    },
    {
        id: 'p2',
        name: '霍乱弧菌',
        code: 'P002',
        scientificName: 'Vibrio cholerae',
        type: '细菌',
        bsl: 'BSL-2',
    },
    {
        id: 'p3',
        name: '鼠疫耶尔森菌',
        code: 'P003',
        scientificName: 'Yersinia pestis',
        type: '细菌',
        bsl: 'BSL-3',
    },
    {
        id: 'p4',
        name: '人类免疫缺陷病毒',
        code: 'P004',
        scientificName: 'HIV',
        type: '病毒',
        bsl: 'BSL-2',
    },
    {
        id: 'p5',
        name: '甲型流感病毒',
        code: 'P005',
        scientificName: 'Influenza A virus',
        type: '病毒',
        bsl: 'BSL-2',
    },
];