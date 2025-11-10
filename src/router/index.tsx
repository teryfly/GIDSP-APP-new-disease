import { createBrowserRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import CaseList from '../pages/CaseList';
import CaseDetail from '../pages/CaseDetail';
import NewCase from '../pages/NewCase';
import EditCase from '../pages/records/EditCase';

import EditBasicInfo from '../pages/records/EditBasicInfo';
import EditEpiInfo from '../pages/records/EditEpiInfo';
import EditDiagnosis from '../pages/records/EditDiagnosis';

import EditFollowUpContract from '../pages/records/EditFollowUpContract';
import EditTreatment from '../pages/records/EditTreatment';
import EditTestRecord from '../pages/records/EditTestRecord';
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
          crumb: () => '工作台',
        },
      },
      {
        path: 'cases',
        element: <CaseList />,
        handle: {
          crumb: () => '个案列表',
        },
      },
      {
        path: 'cases/new',
        element: <NewCase />,
        handle: {
          crumb: () => '新增个案',
        },
      },
      {
        path: 'cases/:id',
        element: <CaseDetail />,
        handle: {
          crumb: () => '个案详情',
        },
      },
      {
        path: 'cases/:id/edit',
        element: <EditCase />,
        handle: {
          crumb: () => '编辑个案',
        },
      },
      {
        path: 'cases/:id/edit-basic',
        element: <EditBasicInfo />,
        handle: {
          crumb: () => '编辑基本信息',
        },
      },
      {
        path: 'cases/:id/edit-epi',
        element: <EditEpiInfo />,
        handle: {
          crumb: () => '编辑流行病学信息',
        },
      },
      {
        path: 'cases/:id/edit-diagnosis',
        element: <EditDiagnosis />,
        handle: {
          crumb: () => '编辑诊断信息',
        },
      },

      // Unified create/edit routes for sub-records
      {
        path: 'cases/:caseId/follow-ups/new',
        element: <EditFollowUpContract />,
        handle: {
          crumb: () => '新增随访记录',
        },
      },
      {
        path: 'cases/:caseId/follow-ups/:id/edit',
        element: <EditFollowUpContract />,
        handle: {
          crumb: () => '编辑随访记录',
        },
      },
      {
        path: 'cases/:caseId/treatments/new',
        element: <EditTreatment />,
        handle: {
          crumb: () => '新增治疗记录',
        },
      },
      {
        path: 'cases/:caseId/treatments/:id/edit',
        element: <EditTreatment />,
        handle: {
          crumb: () => '编辑治疗记录',
        },
      },
      {
        path: 'cases/:caseId/test-records/new',
        element: <EditTestRecord />,
        handle: {
          crumb: () => '新增检测记录',
        },
      },
      {
        path: 'cases/:caseId/test-records/:id/edit',
        element: <EditTestRecord />,
        handle: {
          crumb: () => '编辑检测记录',
        },
      },
      {
        path: 'cases/:caseId/tracking-records/new',
        element: <EditTrackingRecord />,
        handle: {
          crumb: () => '新增追踪记录',
        },
      },
      {
        path: 'cases/:caseId/tracking-records/:id/edit',
        element: <EditTrackingRecord />,
        handle: {
          crumb: () => '编辑追踪记录',
        },
      },
    ],
  },
]);