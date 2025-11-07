import { createBrowserRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import CaseList from '../pages/CaseList';
import CaseDetail from '../pages/CaseDetail';
import UnknownCaseList from '../pages/UnknownCaseList';
import UnknownCaseDetail from '../pages/UnknownCaseDetail';
import AlertList from '../pages/AlertList';
import Statistics from '../pages/Statistics';
import DiseaseCodeList from '../pages/DiseaseCodeList';
import NewCase from '../pages/NewCase'; // Specific New Case Multi-step form
import PathogenList from '../pages/PathogenList';
import AlertDetail from '../pages/AlertDetail'; // Specific Alert Detail

import EditBasicInfo from '../pages/records/EditBasicInfo';
import EditEpiInfo from '../pages/records/EditEpiInfo';
import EditDiagnosis from '../pages/records/EditDiagnosis';
// existing imports
import NewFollowUp from '../pages/records/NewFollowUp';
import EditFollowUp from '../pages/records/EditFollowUp';
import NewTreatment from '../pages/records/NewTreatment';
import EditTreatment from '../pages/records/EditTreatment';
import NewTestRecord from '../pages/records/NewTestRecord';
import EditTestRecord from '../pages/records/EditTestRecord';
import NewTrackingRecord from '../pages/records/NewTrackingRecord';
import EditTrackingRecord from '../pages/records/EditTrackingRecord';
import NewDiseaseCode from '../pages/records/NewDiseaseCode';
import EditDiseaseCode from '../pages/records/EditDiseaseCode';
import NewPathogen from '../pages/records/NewPathogen';
import EditPathogen from '../pages/records/EditPathogen';
import NewUnknownCase from '../pages/records/NewUnknownCase';
import EditCase from '../pages/records/EditCase'; // Specific Edit Case Multi-step form
import EditUnknownCasePersonInfo from '../pages/records/EditUnknownCasePersonInfo';
import EditUnknownCaseRegister from '../pages/records/EditUnknownCaseRegister';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <GlobalLayout />,
        children: [
            {
                index: true,
                element: <Dashboard />,
                handle: {
                    crumb: () => "工作台",
                },
            },
            // Case Management
            {
                path: 'cases',
                element: <CaseList />,
                handle: {
                    crumb: () => "个案列表",
                },
            },
            {
                path: 'cases/new',
                element: <NewCase />, // Specific form for new cases
                handle: {
                    crumb: () => "新增个案",
                },
            },
            {
                path: 'cases/:id',
                element: <CaseDetail />,
                handle: {
                    crumb: () => "个案详情",
                },
            },
            {
                path: 'cases/:id/edit',
                element: <EditCase />, // Specific edit page for a case
                handle: {
                    crumb: () => "编辑个案",
                },
            },
            // New edit pages for different sections
            {
                path: 'cases/:id/edit-basic',
                element: <EditBasicInfo />,
                handle: {
                    crumb: () => "编辑基本信息",
                },
            },
            {
                path: 'cases/:id/edit-epi',
                element: <EditEpiInfo />,
                handle: {
                    crumb: () => "编辑流行病学信息",
                },
            },
            {
                path: 'cases/:id/edit-diagnosis',
                element: <EditDiagnosis />,
                handle: {
                    crumb: () => "编辑诊断信息",
                },
            },
            // Sub-records of cases
            {
                path: 'cases/:caseId/follow-ups/new',
                element: <NewFollowUp />,
                handle: {
                    crumb: () => "新增随访记录",
                },
            },
            {
                path: 'cases/:caseId/follow-ups/:id/edit',
                element: <EditFollowUp />,
                handle: {
                    crumb: () => "编辑随访记录",
                },
            },
            {
                path: 'cases/:caseId/treatments/new',
                element: <NewTreatment />,
                handle: {
                    crumb: () => "新增治疗记录",
                },
            },
            {
                path: 'cases/:caseId/treatments/:id/edit',
                element: <EditTreatment />,
                handle: {
                    crumb: () => "编辑治疗记录",
                },
            },
            {
                path: 'cases/:caseId/test-records/new',
                element: <NewTestRecord />,
                handle: {
                    crumb: () => "新增检测记录",
                },
            },
            {
                path: 'cases/:caseId/test-records/:id/edit',
                element: <EditTestRecord />,
                handle: {
                    crumb: () => "编辑检测记录",
                },
            },
            {
                path: 'cases/:caseId/tracking-records/new',
                element: <NewTrackingRecord />,
                handle: {
                    crumb: () => "新增追踪记录",
                },
            },
            {
                path: 'cases/:caseId/tracking-records/:id/edit',
                element: <EditTrackingRecord />,
                handle: {
                    crumb: () => "编辑追踪记录",
                },
            },

            // Unknown Cases
            {
                path: 'unknown-cases',
                element: <UnknownCaseList />,
                handle: {
                    crumb: () => "不明原因病例列表",
                },
            },
            {
                path: 'unknown-cases/new',
                element: <NewUnknownCase />,
                handle: {
                    crumb: () => "新增不明原因病例",
                },
            },
            {
                path: 'unknown-cases/:id',
                element: <UnknownCaseDetail />,
                handle: {
                    crumb: () => "不明原因病例详情",
                },
            },
            {
                path: 'unknown-cases/:id/edit-person',
                element: <EditUnknownCasePersonInfo />,
                handle: {
                    crumb: () => "编辑个人资料",
                },
            },
            {
                path: 'unknown-cases/:id/edit-register/:eventId',
                element: <EditUnknownCaseRegister />,
                handle: {
                    crumb: () => "编辑不明病例登记",
                },
            },
            // Test Records for Unknown Cases
            {
                path: 'unknown-cases/:unknownCaseId/test-records/new',
                element: <NewTestRecord />,
                handle: {
                    crumb: () => "新增检测记录",
                },
            },
            {
                path: 'unknown-cases/:unknownCaseId/test-records/:id/edit',
                element: <EditTestRecord />,
                handle: {
                    crumb: () => "编辑检测记录",
                },
            },

            // Alert Management
            {
                path: 'alerts',
                element: <AlertList />,
                handle: {
                    crumb: () => "预警列表",
                },
            },
            {
                path: 'alerts/:id/detail',
                element: <AlertDetail />, // Specific detail page for alerts
                handle: {
                    crumb: () => "预警详情",
                },
            },

            // Statistics (no new/edit implied)
            {
                path: 'statistics',
                element: <Statistics />,
                handle: {
                    crumb: () => "疾病统计",
                },
            },

            // Master Data Management - Disease Codes
            {
                path: 'disease-codes',
                element: <DiseaseCodeList />,
                handle: {
                    crumb: () => "疾病编码管理",
                },
            },
            {
                path: 'disease-codes/new',
                element: <NewDiseaseCode />, // Specific new page for disease code
                handle: {
                    crumb: () => "新增疾病编码",
                },
            },
            {
                path: 'disease-codes/:id/edit',
                element: <EditDiseaseCode />, // Specific edit page for disease code
                handle: {
                    crumb: () => "编辑疾病编码",
                },
            },

            // Master Data Management - Pathogens
            {
                path: 'pathogens',
                element: <PathogenList />,
                handle: {
                    crumb: () => "病原微生物管理",
                },
            },
            {
                path: 'pathogens/new',
                element: <NewPathogen />, // Specific new page for pathogen
                handle: {
                    crumb: () => "新增病原体",
                },
            },
            {
                path: 'pathogens/:id/edit',
                element: <EditPathogen />, // Specific edit page for pathogen
                handle: {
                    crumb: () => "编辑病原体",
                },
            },
        ],
    },
]);