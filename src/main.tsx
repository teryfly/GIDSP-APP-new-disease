import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm, // Changed from darkAlgorithm to defaultAlgorithm for light theme
        token: {
          colorPrimary: '#1890ff', // Using a standard Ant Design blue for primary color
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)