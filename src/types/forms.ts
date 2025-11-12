import moment from 'moment';

// PF-5.2.4 Follow-up Form Data
export interface FollowUpFormData {
    caseId?: string; // Hidden, auto-filled from URL
    unknownCaseId?: string; // Hidden, auto-filled from URL
    followUpDate: moment.Moment;
    followUpMethod: '电话随访' | '现场随访' | '线上随访';
    followUpUserId?: string; // Auto-filled current user
    healthStatus: '好转' | '稳定' | '异常' | '恶化';
    temperature?: number; // 35.0-42.0
    symptoms?: string; // 0-500 chars
    treatmentCompliance: '良好' | '一般' | '差';
    nextFollowUpDate?: moment.Moment;
    remarks?: string; // 0-500 chars
}

// PF-5.2.5 Treatment Form Data
export interface TreatmentFormData {
    caseId?: string; // Hidden, auto-filled from URL
    treatmentDate: moment.Moment;
    treatmentType: '门诊' | '住院' | '居家隔离';
    hospitalName: string; // 2-200 chars
    departmentName?: string; // 2-100 chars
    doctorName?: string; // 2-50 chars
    diagnosis: string; // 10-500 chars
    treatmentPlan: string; // 10-1000 chars
    medications?: string; // 0-1000 chars
    treatmentOutcome?: '治愈' | '好转' | '无效' | '死亡' | '转院';
    dischargeDate?: moment.Moment; // Only for '住院', not earlier than treatmentDate
    createdBy?: string; // Auto-filled
}

// PF-5.2.6 Test Record Form Data
export interface TestRecordFormData {
    caseId?: string; // Hidden, auto-filled from URL
    unknownCaseId?: string; // Hidden, auto-filled from URL
    testNo?: string; // System auto-generated
    sampleCollectionDate: moment.Moment;
    sampleType: '咽拭子' | '血液' | '粪便' | '尿液' | '其他';
    testType: '核酸检测' | '抗体检测' | '培养' | '影像学' | '其他';
    testOrgName: string; // 2-200 chars
    testDate?: moment.Moment; // Not earlier than sampleCollectionDate
    testResult?: '阳性' | '阴性' | '待定' | '不确定';
    resultDetails?: string; // 0-1000 chars
    pathogenDetected?: string; // 0-200 chars, suggested for positive results
    testStatus: '待确认' | '已确认';
    labReportFile?: any; // File upload type
    createdBy?: string; // Auto-filled
}

// PF-5.2.7 Tracking Record Form Data
export interface TrackingRecordFormData {
    caseId?: string; // Hidden, auto-filled from URL
    trackingDate: moment.Moment;
    trackingType: '旅居史' | '接触史' | '物品暴露史' | '场所暴露史';
    startDate: moment.Moment;
    endDate: moment.Moment; // Not earlier than startDate
    regionId: string; // Cascader for 省/市/县
    locationDescription: string; // 10-500 chars
    longitude?: number;
    latitude?: number;
    contactPersons?: string; // 0-1000 chars, for '接触史'
    exposureDetails?: string; // 10-1000 chars
    riskAssessment: '高风险' | '中风险' | '低风险';
    createdBy?: string; // Auto-filled
}

// PF-5.6.1 Disease Code Form Data
export interface DiseaseCodeFormData {
    id?: string;
    diseaseCode: string; // Unique
    diseaseName: string; // 2-200 chars
    diseaseCategory: '甲类' | '乙类' | '丙类' | '其他';
    icdCode?: string; // ICD format
    description?: string; // 0-1000 chars
    riskLevel: '高' | '中' | '低';
    isQuarantine: boolean;
    isActive: boolean;
    relatedPathogens?: string[]; // Multi-select pathogen IDs
}

// PF-5.6.2 Pathogen Form Data
export interface PathogenFormData {
    id?: string;
    pathogenCode: string; // Unique
    pathogenName: string; // 2-200 chars
    pathogenType: '病毒' | '细菌' | '真菌' | '寄生虫' | '其他';
    scientificName?: string; // 0-200 chars
    associatedDiseases?: string; // 0-1000 chars
    description?: string; // 0-1000 chars
    biosafettyLevel: 'BSL-1' | 'BSL-2' | 'BSL-3' | 'BSL-4';
    isActive: boolean;
}

// PF-5.3.3 Unknown Case Form Data
export interface UnknownCaseFormData {
    id?: string;
    patientName: string; // 2-50 chars
    gender: '男' | '女' | '未知';
    idCardNo?: string; // ID card format, auto-verify duplicates
    age: number; // 0-150
    phone: string; // Phone number format
    address: string; // 5-500 chars (cascader + detail)
    reportOrgId?: string; // Auto-filled
    reportUserId?: string; // Auto-filled
    reportDate: moment.Moment; // Auto-filled
    symptomOnsetDate: moment.Moment; // Not later than today
    clinicalSymptoms: string; // 20-2000 chars
    suspectedPathogen?: string; // 0-200 chars
    initialAssessment?: string; // 0-500 chars
    urgencyLevel: '高' | '中' | '低';
}

// PF-5.2.3 New Case Form Data (simplified for editing existing case)
export interface CaseFormData {
    id?: string;
    diseaseId: string;
    patientName: string;
    gender: 'male' | 'female';
    idCard: string;
    dob?: moment.Moment;
    age: number;
    phone: string;
    address: string;
    reportUnit: string;
    reporter: string;
    reportDate: moment.Moment;
    symptomOnsetDate: moment.Moment;
    hasExposure: boolean;
    exposureHistory?: string;
    hasContact: boolean;
    contactDate?: moment.Moment;
    contactLocation?: string;
    contactHistory?: string;
    hasTravel: boolean;
    travelStartDate?: moment.Moment;
    travelEndDate?: moment.Moment;
    travelDestination?: string;
    travelHistory?: string;
    initialDiagnosis: string;
    confirmedDiagnosis?: string;
    diagnosisDate: moment.Moment;
    caseSource: 'active' | 'passive' | 'unknown';
    symptoms?: string[];
    otherSymptoms?: string;
}