import { createBrowserRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import DiseaseCodeList from '../pages/DiseaseCodeList';
import NewDiseaseCode from '../pages/records/NewDiseaseCode';
import EditDiseaseCode from '../pages/records/EditDiseaseCode';
import NewPathogen from '../pages/records/NewPathogen';
import EditPathogen from '../pages/records/EditPathogen';
import PathogenList from '../pages/PathogenList';

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