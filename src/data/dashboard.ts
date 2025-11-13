export const metrics = [
    { title: '本月新增个案', value: 156, trend: 15, unit: '%' },
    { title: '已核实个案', value: 3, link: '/cases?status=已核实' },
    { title: '处理中个案', value: 12, link: '/cases?status=处理中' },
    { title: '本月预警事件', value: 2, link: '/alerts?status=待处理' },
];

export const todoItems = [
    { 
        id: 'todo-1',
        category: '已核实个案',
        count: 3,
        items: [
            'CAS-2024-156 | 李四 | 新冠肺炎 | 2024-01-15',
            'CAS-2024-155 | 王五 | 霍乱     | 2024-01-15',
            'CAS-2024-154 | 赵六 | 鼠疫     | 2024-01-14',
        ]
    },
    {
        id: 'todo-2',
        category: '待确认检测',
        count: 5,
        items: [
            'TEST-2024-089 | CAS-2024-150 | 核酸检测',
            'TEST-2024-088 | CAS-2024-149 | 抗体检测',
        ]
    },
    {
        id: 'todo-3',
        category: '待处理预警',
        count: 2,
        items: [
            'ALT-2024-012 | 病例聚集 | 北京市 | 高风险',
            'ALT-2024-011 | 异常症状 | 上海市 | 中风险',
        ]
    }
];

export const recentVisits = [
    { id: 'rv-1', name: 'CAS-2024-156', link: '/cases/1' },
    { id: 'rv-2', name: 'CAS-2024-150', link: '/cases/2' },
    { id: 'rv-3', name: 'ALT-2024-012', link: '/alerts' },
    { id: 'rv-4', name: '疾病统计报表', link: '/statistics' },
];

export const quickAccess = [
    { id: 'qa-1', name: '新增个案', link: '/cases/new' },
    { id: 'qa-2', name: '新增不明病例', link: '/unknown-cases/new' },
    { id: 'qa-3', name: '疾病统计', link: '/statistics' },
    { id: 'qa-4', name: '导出报告', link: '#' },
];