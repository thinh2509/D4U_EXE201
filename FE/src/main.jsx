import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'missing-google-client-id';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#12AEEA',
          colorInfo: '#0EA5E9',
          colorSuccess: '#16A34A',
          colorWarning: '#F59E0B',
          colorError: '#DC2626',
          colorText: '#1D2428',
          colorTextSecondary: '#667985',
          colorBorder: '#D7E5EC',
          colorBorderSecondary: '#EAF3F7',
          colorBgLayout: '#F6FAFD',
          colorBgContainer: '#FFFFFF',
          controlHeight: 42,
          controlHeightLG: 48,
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily: '"DM Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        },
        components: {
          Layout: {
            bodyBg: '#F6FAFD',
            siderBg: '#FFFFFF',
            headerBg: 'transparent'
          },
          Button: {
            controlHeightLG: 48,
            borderRadius: 8,
            primaryShadow: '0 4px 12px rgba(18,174,234,0.28)'
          },
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary: '0 8px 30px rgba(7,16,20,0.06)'
          },
          Input: {
            controlHeightLG: 48,
            hoverBorderColor: '#12AEEA',
            activeBorderColor: '#12AEEA',
            activeShadow: '0 0 0 3px rgba(18,174,234,0.16)'
          },
          Select: {
            controlHeightLG: 48,
            hoverBorderColor: '#12AEEA',
            activeBorderColor: '#12AEEA'
          },
          Table: {
            headerBg: '#EEF6FA',
            headerColor: '#1D2428'
          }
        }
      }}
    >
      <AntApp
        message={{
          top: 88,
          maxCount: 3,
          duration: 3,
        }}
      >
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
