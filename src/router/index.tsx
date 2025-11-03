import { createBrowserRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import CaseList from '../pages/CaseList';
import CaseDetail from '../pages/CaseDetail';
import NewCase from '../pages/NewCase'; // Specific New Case Multi-step form
import EditCase from '../pages/records/EditCase'; // Specific Edit Case Multi-step form

// Import new record pages
import NewFollowUp from '../pages/records/NewFollowUp';
import EditFollowUp from '../pages/records/EditFollowUp';
import NewTreatment from '../pages/records/NewTreatment';
import EditTreatment from '../pages/records/EditTreatment';
import NewTestRecord from '../pages/records/NewTestRecord';
import EditTestRecord from '../pages/records/EditTestRecord';
import NewTrackingRecord from '../pages/records/NewTrackingRecord';
import EditTrackingRecord from '../pages/records/EditTrackingRecord';

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
        ],
    },
]);