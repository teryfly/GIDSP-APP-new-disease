import { StrictMode, useEffect } from 'react'
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
    <AntdApp>
      <App />
    </AntdApp>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)