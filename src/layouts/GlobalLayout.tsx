import { useState } from 'react';
import {
    DesktopOutlined,
    PieChartOutlined,
    UserOutlined,
    AlertOutlined,
    ExperimentOutlined,
    FileProtectOutlined,
    DatabaseOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BellOutlined,
    BugOutlined, // Added for pathogens
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Breadcrumb, Dropdown, Layout, Menu, Space, theme } from 'antd';
import { Outlet, useMatches, Link } from 'react-router-dom';
import Logo from '../assets/logo.svg';

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

const menuItems: MenuItem[] = [
    getItem(<Link to="/">首页</Link>, '/', <PieChartOutlined />),
    getItem('个案管理', 'sub1', <UserOutlined />, [
        getItem(<Link to="/cases">个案列表</Link>, '/cases'),
    ]),
    getItem('不明原因疾病', 'sub2', <ExperimentOutlined />, [
        getItem(<Link to="/unknown-cases">病例列表</Link>, '/unknown-cases'),
    ]),
    getItem('预警管理', 'sub3', <AlertOutlined />, [
        getItem(<Link to="/alerts">预警列表</Link>, '/alerts'),
    ]),
    getItem('统计分析', 'sub4', <DesktopOutlined />, [
        getItem(<Link to="/statistics">疾病统计</Link>, '/statistics'),
    ]),
    getItem('基础数据管理', 'sub5', <DatabaseOutlined />, [
        getItem(<Link to="/disease-codes">疾病编码管理</Link>, '/disease-codes'),
        getItem(<Link to="/pathogens">病原微生物管理</Link>, '/pathogens', <BugOutlined />),
    ]),
    getItem('系统管理', 'sub6', <SettingOutlined />, [
        getItem('用户管理', '11'),
        getItem('角色权限管理', '12'),
    ]),
];

const userMenuItems = [
    { key: '1', label: '个人中心' },
    { key: '2', label: '修改密码' },
    { type: 'divider' },
    { key: '3', label: '退出登录' },
];

const GlobalLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const matches = useMatches();
    const breadcrumbItems = matches
        .filter((match: any) => match.handle?.crumb)
        .map((match: any) => ({
            title: <Link to={match.pathname}>{match.handle.crumb(match.data)}</Link>,
        }));


    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{
                    height: '32px',
                    margin: '16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    color: 'white',
                    gap: '8px'
                }}>
                    <img src={Logo} alt="logo" style={{ height: '24px', width: '24px' }} />
                    {!collapsed && <span>新发传染病监测系统</span>}
                </div>
                <Menu theme="dark" defaultSelectedKeys={['/']} mode="inline" items={menuItems} />
            </Sider>
            <Layout>
                {/* <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <MenuFoldOutlined
                        className="trigger"
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '18px' }}
                    />
                    <Space size="middle">
                        <Badge count={3}>
                            <BellOutlined style={{ fontSize: '18px' }} />
                        </Badge>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                        </Dropdown>
                    </Space>
                </Header> */}
                <Content style={{ margin: '0 16px', display: 'flex', flexDirection: 'column' }}>
                    <Breadcrumb style={{ margin: '16px 0' }} items={[{ title: <Link to="/">首页</Link> }, ...breadcrumbItems]} />
                    <div
                        style={{
                            padding: 24,
                            flex: 1,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            overflowY: 'auto'
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default GlobalLayout;