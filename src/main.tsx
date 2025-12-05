import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './index.css'
import App from './App.tsx'
import { primeRequiredOptionSets } from './api/optionSets';

function Bootstrap() {
  useEffect(() => {
    primeRequiredOptionSets();
  }, []);
  return (
    <AntdApp notification={{ placement: 'topRight' }} message={{ duration: 3, maxCount: 3 }}>
      <App />
    </AntdApp>
  );
}

createRoot(document.getElementById('root')!).render(
  // 在开发环境中，React.StrictMode会导致某些函数执行两次，用于检测副作用
  // 如果需要禁用此行为，可以注释掉StrictMode包装器，但在生产环境中不会有此问题
  // <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Bootstrap />
    </ConfigProvider>
  // </StrictMode>,
)