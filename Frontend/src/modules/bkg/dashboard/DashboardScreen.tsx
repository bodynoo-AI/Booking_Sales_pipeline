import React, { useState } from 'react';
import { Row, Col, Badge, Button, Empty, Drawer, Spin, Table } from 'antd';
import {
  RiseOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { useBookings, useDashboard, useAlerts } from '../hooks';
import { StatusTag, ClientAvatar } from '../components/SharedComponents';
import { StatusDonutChart, StatusLegend, RevenueTrendChart } from '../components/DashboardCharts';
import type { BookingStatus } from '../types';

const BRAND_RED = '#c7361a';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}> = ({ title, value, suffix, icon, trend, color }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 14,
      padding: '22px 24px',
      border: '1px solid #f0f0f0',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 80,
        height: 80,
        background: color,
        opacity: 0.06,
        borderRadius: '0 14px 0 80px',
      }}
    />

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            color: '#9ca3af',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {value}
          {suffix && (
            <span
              style={{
                fontSize: 16,
                marginLeft: 4,
              }}
            >
              {suffix}
            </span>
          )}
        </div>

        {trend && (
          <div
            style={{
              color: '#16a34a',
              fontSize: 12,
              marginTop: 6,
            }}
          >
            <RiseOutlined /> {trend}
          </div>
        )}
      </div>

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: color,
          opacity: 0.12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </div>
    </div>
  </div>
);

const ALERT_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  warning: { icon: <WarningOutlined />, color: '#b45309', bg: '#fef3c7' },
  error: { icon: <CloseCircleOutlined />, color: '#b91c1c', bg: '#fee2e2' },
  info: { icon: <InfoCircleOutlined />, color: '#1d4ed8', bg: '#dbeafe' },
  success: { icon: <CheckCircleOutlined />, color: '#15803d', bg: '#dcfce7' },
};

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);

  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const { data: bookingData, isLoading: bookingsLoading } = useBookings({});

  const stats = dashboardData?.data ?? {
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    activeHolds: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    conversionRate: 0,
    upcomingEvents: 0,
    statusBreakdown: [],
    revenueTrend: [],
  };

  const recentBookings = Array.isArray(bookingData?.data) ? bookingData.data.slice(0, 4) : [];
  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const isLoading = dashboardLoading || alertsLoading || bookingsLoading;

  const statusBreakdown = stats.statusBreakdown ?? [];
  const revenueTrend = stats.revenueTrend ?? [];

  const handleSelectStatus = (status: BookingStatus) => {
    setSelectedStatus((prev) => (prev === status ? null : status));
    setStatusDrawerOpen(true);
  };

  const drawerBookings = React.useMemo(() => {
    if (!selectedStatus || !Array.isArray(bookingData?.data)) return [];
    return bookingData.data.filter((b: any) => b.status === selectedStatus);
  }, [selectedStatus, bookingData]);

  return (
    <div
      style={{
        padding: 28,
        maxWidth: 1400,
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Operations Dashboard
        </div>

        <div
          style={{
            color: '#6b7280',
          }}
        >
          Live snapshot
          of your booking
          pipeline and
          venue performance.
        </div>
      </div>

      <Row
        gutter={[16, 16]}
      >
        <Col span={5}>
          <StatCard
            title="TOTAL BOOKINGS"
            value={
              stats.totalBookings
            }
            icon={
              <CalendarOutlined />
            }
            color="#6366f1"
          />
        </Col>

        <Col span={5}>
          <StatCard
            title="CONFIRMED"
            value={
              stats.confirmedBookings
            }
            icon={
              <CheckCircleOutlined />
            }
            color="#16a34a"
          />
        </Col>

        <Col span={5}>
          <StatCard
            title="REVENUE THIS MONTH"
            value={`₹${stats.revenueThisMonth.toLocaleString('en-IN')}`}
            icon={
              <DollarOutlined />
            }
            color={
              BRAND_RED
            }
          />
        </Col>

        <Col span={4}>
          <StatCard
            title="ACTIVE HOLDS"
            value={
              stats.activeHolds
            }
            icon={
              <ClockCircleOutlined />
            }
            color="#d97706"
          />
        </Col>

        <Col span={5}>
          <StatCard
            title="CONVERSION RATE"
            value={
              stats.conversionRate
            }
            suffix="%"
            icon={
              <RiseOutlined />
            }
            color="#0891b2"
          />
        </Col>
      </Row>

      {/* ── Distribution + Revenue Trend ─────────────────────────────────────── */}
      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={9}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Booking Status Distribution</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 11.5, marginBottom: 16 }}>Click a status to see matching bookings</div>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin size="small" />
              </div>
            ) : statusBreakdown.length === 0 ? (
              <Empty description="No bookings yet" style={{ padding: '20px 0' }} />
            ) : (
              <>
                <StatusDonutChart data={statusBreakdown} onSelect={handleSelectStatus} selected={selectedStatus} />
                <div style={{ marginTop: 18 }}>
                  <StatusLegend data={statusBreakdown} onSelect={handleSelectStatus} selected={selectedStatus} />
                </div>
              </>
            )}
          </div>
        </Col>

        <Col xs={24} lg={15}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Revenue Trend</span>
              <span style={{ color: '#9ca3af', fontSize: 11.5 }}>Last 6 months</span>
            </div>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin size="small" />
              </div>
            ) : revenueTrend.length === 0 ? (
              <Empty description="No revenue data yet" style={{ padding: '20px 0' }} />
            ) : (
              <div style={{ marginTop: 16 }}>
                <RevenueTrendChart data={revenueTrend} color={BRAND_RED} />
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row
        gutter={[20, 20]}
        style={{
          marginTop: 24,
        }}
      >
        <Col
          xs={24}
          lg={15}
        >
          <div
            style={{
              background:
                '#fff',
              borderRadius: 14,
              border: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                padding: 20,
                display:
                  'flex',
                justifyContent:
                  'space-between',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                Recent
                Bookings
              </div>

              <Button
                type="link"
                icon={
                  <ArrowRightOutlined />
                }
                onClick={() =>
                  navigate(
                    '/bkg/bookings'
                  )
                }
              >
                View All
              </Button>
            </div>

            {isLoading ? (
              <div
                style={{
                  padding:
                    20,
                }}
              >
                Loading...
              </div>
            ) : recentBookings.length ===
              0 ? (
              <Empty style={{ padding: '20px 0 32px' }} />
            ) : (
                  recentBookings.map((b: any) => (
                    <div
                      key={b.id}
                      onClick={() =>
                        navigate(`/bkg/bookings/${b.id}`)
                      }
                      style={{
                        padding: 20,
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <ClientAvatar
                          initials={b.client?.avatarInitials || '?'}
                          color={b.client?.avatarColor}
                          size={36}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {b.eventTitle}
                          </div>

                          <div
                            style={{
                              color: '#6b7280',
                              marginTop: 4,
                              fontSize: 12.5,
                            }}
                          >
                            {b.client?.name ?? '-'}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          flexShrink: 0,
                        }}
                      >
                        <StatusTag
                          status={b.status}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))
              )
            }
          </div>
        </Col>

        <Col
          xs={24}
          lg={9}
        >
          <div
            style={{
              background:
                '#fff',
              borderRadius: 14,
              border: '1px solid #f0f0f0',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                Active Alerts
              </span>

              <Badge
                count={
                  alerts.length
                }
                style={{ background: BRAND_RED }}
              />
            </div>

            {alertsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Spin size="small" />
              </div>
            ) : alerts.length === 0 ? (
              <Empty description="No active alerts" style={{ padding: '20px 0' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map((alert) => {
                  const cfg = ALERT_ICONS[alert.type] ?? ALERT_ICONS.info;
                  return (
                    <div
                      key={alert.id}
                      onClick={() => alert.bookingId && navigate(`/bkg/bookings/${alert.bookingId}`)}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: cfg.bg,
                        cursor: alert.bookingId ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ color: cfg.color, fontSize: 15, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#111827' }}>{alert.title}</div>
                        <div style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>{alert.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Drawer
        title={selectedStatus ? `${selectedStatus.replace('_', ' ')} Bookings` : 'Bookings'}
        open={statusDrawerOpen}
        onClose={() => setStatusDrawerOpen(false)}
        width={480}
      >
        {drawerBookings.length === 0 ? (
          <Empty description="No bookings with this status" />
        ) : (
          <Table
            dataSource={drawerBookings}
            rowKey="id"
            size="small"
            pagination={false}
            onRow={(record: any) => ({
              onClick: () => {
                setStatusDrawerOpen(false);
                navigate(`/bkg/bookings/${record.id}`);
              },
              style: { cursor: 'pointer' },
            })}
            columns={[
              { title: 'Ref', dataIndex: 'bookingRef', render: (v) => <span style={{ color: BRAND_RED, fontWeight: 700 }}>#{v}</span> },
              { title: 'Event', dataIndex: 'eventTitle' },
              {
                title: 'Revenue',
                dataIndex: 'revenue',
                align: 'right',
                render: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};

export default DashboardScreen;
