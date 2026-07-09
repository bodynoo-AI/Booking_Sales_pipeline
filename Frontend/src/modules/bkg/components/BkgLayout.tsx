import React, { useState } from 'react';
import { Layout, Input, Badge, Avatar, Tooltip } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  DollarOutlined,
  PieChartOutlined,
  InboxOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useBkgSocket } from '../hooks/useSocket';
import { AuthApi } from '../services';

const { Header, Sider, Content } = Layout;

const BRAND_RED = '#c7361a';
const SIDEBAR_BG = '#ffffff';
const SIDEBAR_ACTIVE_BG = 'rgba(199,54,26,0.15)';

const SIDE_MENU_ITEMS = [
  { key: '/bkg', icon: <DashboardOutlined />, label: 'Master Register' },
  { key: '/bkg/bookings', icon: <InboxOutlined />, label: 'Upcoming Departures' },
  { key: '/bkg/deposits', icon: <DollarOutlined />, label: 'Revenue & Deposits' },
  { key: '/bkg/calendar', icon: <CalendarOutlined />, label: 'Resource Utilization' },
  { key: '/bkg/venues', icon: <InboxOutlined />, label: 'Venue Management' },
  { key: '/bkg/reports', icon: <PieChartOutlined />, label: 'Booking Archive' },
];

const TOP_NAV_ITEMS = [
  { key: '/bkg', label: 'Dashboard' },
  { key: '/bkg/bookings', label: 'Master Register' },
  { key: '/bkg/calendar', label: 'Resources' },
];

const BkgLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useBkgSocket();
  const userName = localStorage.getItem('auth_user_name') || 'Admin User';
  const initials = userName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const handleSignOut = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // ignore network failures
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_name');
    localStorage.removeItem('auth_user_email');
    window.location.href = '/login';
  };

  const activeTopKey =
    TOP_NAV_ITEMS.find((i) => location.pathname === i.key)?.key || '/bkg/bookings';
  const activeSideKey =
    SIDE_MENU_ITEMS.find((i) => location.pathname.startsWith(i.key) && i.key !== '/bkg')?.key ??
    (location.pathname === '/bkg' ? '/bkg' : '/bkg/bookings');

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          height: 56,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 180 }}
          onClick={() => navigate('/bkg')}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: BRAND_RED,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '-1px',
            }}
          >
            EH
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111827', letterSpacing: '-0.5px' }}>
            EventHub360
          </span>
        </div>
          <button
            onClick={handleSignOut}
            style={{
              marginLeft: 16,
              background: 'none',
              border: '1px solid rgba(199, 54, 26, 0.2)',
              color: BRAND_RED,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            <LogoutOutlined style={{ marginRight: 6 }} /> Sign out
          </button>
        {/* Search + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search bookings..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 220, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}
            size="middle"
          />
          <Tooltip title="Notifications">
            <Badge count={3} size="small" style={{ background: BRAND_RED }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4b5563',
                  fontSize: 18,
                }}
              >
                <BellOutlined />
              </button>
            </Badge>
          </Tooltip>
          <Tooltip title="Settings">
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                fontSize: 18,
              }}
            >
              <SettingOutlined />
            </button>
          </Tooltip>
          <Avatar size={34} style={{ background: '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            {initials}
          </Avatar>
        </div>
      </Header>

      <Layout style={{ marginTop: 56 }}>
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={220}
          collapsedWidth={64}
          style={{
            background: SIDEBAR_BG,
            position: 'fixed',
            left: 0,
            top: 56,
            bottom: 0,
            zIndex: 90,
            overflow: 'hidden',
          }}
        >
          {!collapsed && (
            <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: BRAND_RED,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  CS
                </div>
                <div>
                  <div style={{ color: '#ae2f34', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                    Concierge Suite
                  </div>
                  <div
                    style={{
                      color: 'rgba(33, 107, 172, 0.52)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                    }}
                  >
                    MANAGEMENT PORTAL
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '8px 0' }}>
            {SIDE_MENU_ITEMS.map((item) => {
              const isActive = activeSideKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    width: '100%',
                    background: isActive ? SIDEBAR_ACTIVE_BG : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: collapsed ? '12px 0' : '11px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: isActive ? '#ae2f34' : 'rgb(174, 47, 52)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13.5,
                    borderLeft: isActive ? `3px solid ${BRAND_RED}` : '3px solid transparent',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              bottom: 16,
              left: collapsed ? '50%' : 16,
              transform: collapsed ? 'translateX(-50%)' : 'none',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          {!collapsed && (
            <div
              style={{
                position: 'absolute',
                bottom: 60,
                left: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <QuestionCircleOutlined />
              <span>Help Desk</span>
            </div>
          )}
        </Sider>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <Content
          style={{
            marginLeft: collapsed ? 64 : 220,
            transition: 'margin-left 0.2s',
            minHeight: 'calc(100vh - 56px)',
            background: '#f5f5f7',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BkgLayout;
