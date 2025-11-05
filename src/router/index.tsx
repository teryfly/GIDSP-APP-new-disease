import { createHashRouter } from 'react-router-dom';
import GlobalLayout from '../layouts/GlobalLayout';
import Dashboard from '../pages/Dashboard';

// 使用 HashRouter 避免 DHIS2 路径冲突
export const router = createHashRouter([
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
        ],
    },
]);