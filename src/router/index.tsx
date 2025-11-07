import { createBrowserRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import CaseList2 from '../pages/CaseList2';
import NewTestRecord from '../pages/records/NewTestRecord';
import EditTestRecord from '../pages/records/EditTestRecord';
import UnknownCaseList from '../pages/UnknownCaseList';
import UnknownCaseDetail from '../pages/UnknownCaseDetail';
import NewUnknownCase from '../pages/records/NewUnknownCase';
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
                element: <CaseList2 />,
                handle: {
                    crumb: () => "个案列表",
                },
            },
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
        ],
    },
]);