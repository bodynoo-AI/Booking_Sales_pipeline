import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, App as AntApp } from 'antd';
import queryClient from './queryClient';
import BkgRoutes from './modules/bkg/routes';
import LoginPage from './modules/bkg/components/LoginPage';
import ProtectedRoute from './modules/bkg/components/AuthGuard';

const theme = {
  token: {
    colorPrimary: '#c7361a',
    colorLink: '#c7361a',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorBgLayout: '#f5f5f7',
  },
  components: {
    Table: {
      headerBg: '#ffffff',
      headerColor: '#374151',
      borderColor: '#f3f4f6',
      rowHoverBg: '#fdf7f5',
    },
    Menu: {
      darkItemColor: 'rgba(255,255,255,0.55)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedColor: '#ffffff',
      darkItemSelectedBg: 'rgba(199,54,26,0.15)',
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Tabs: {
      inkBarColor: '#c7361a',
      itemActiveColor: '#c7361a',
      itemSelectedColor: '#c7361a',
      itemHoverColor: '#c7361a',
    },
    Steps: {
      colorPrimary: '#c7361a',
    },
  },
};

const AppRoot: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider theme={theme}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/bkg/*" element={<ProtectedRoute><BkgRoutes /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/bkg" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

export default AppRoot;
