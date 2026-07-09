import React, { useState } from 'react';
import {
  Tabs,
  Row,
  Col,
  Progress,
  Table,
  Spin,
  Empty,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ReportApi } from '../services';
import { StatusTag } from '../components/SharedComponents';

const BRAND_RED = '#c7361a';

const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('register');

  const registerQuery = useQuery({
    queryKey: ['reports', 'register'],
    queryFn: () => ReportApi.getRegister(),
  });

  const utilisationQuery = useQuery({
    queryKey: ['reports', 'utilisation'],
    queryFn: () => ReportApi.getCalendarUtilisation(),
  });

  const cancellationsQuery = useQuery({
    queryKey: ['reports', 'cancellations'],
    queryFn: () => ReportApi.getCancellations(),
  });

  const conversionQuery = useQuery({
    queryKey: ['reports', 'conversion'],
    queryFn: () => ReportApi.getConversionTime(),
  });

  const registerData = registerQuery.data?.data;
  const utilisationData = utilisationQuery.data?.data ?? [];
  const cancellationsData = cancellationsQuery.data?.data;
  const conversionData = conversionQuery.data?.data;

  const totals = {
    totalBookings: registerData?.summary.total ?? 0,
    confirmed:
      registerData?.summary.byStatus?.CONFIRMED ?? 0,
    pending: registerData?.summary.byStatus?.PENDING ?? 0,
    cancelled:
      registerData?.summary.byStatus?.CANCELLED ?? 0,
  };

  const registerBookings = registerData?.bookings ?? [];

  const tabItems = [
    {
      key: 'register',
      label: 'Booking Register',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            {[
              {
                label: 'Total Bookings',
                value: totals.totalBookings,
                color: '#6366f1',
              },
              {
                label: 'Confirmed',
                value: totals.confirmed,
                color: '#16a34a',
              },
              { label: 'Pending', value: totals.pending, color: '#d97706' },
              {
                label: 'Cancelled',
                value: totals.cancelled,
                color: '#dc2626',
              },
            ].map((s) => (
              <Col key={s.label} span={6}>
                <div
                  style={{
                    background: '#fafafa',
                    borderRadius: 10,
                    padding: '16px 20px',
                    border: '1px solid #f0f0f0',
                  }}
                >
                  <div
                    style={{
                      color: '#9ca3af',
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          {registerBookings.length > 0 ? (
            <Table
              dataSource={registerBookings}
              rowKey="id"
              size="small"
              loading={registerQuery.isLoading}
              columns={[
                {
                  title: 'Ref',
                  dataIndex: 'bookingRef',
                  render: (v: string) => (
                    <span style={{ color: BRAND_RED, fontWeight: 700 }}>
                      #{v}
                    </span>
                  ),
                },
                {
                  title: 'Client',
                  dataIndex: ['client', 'name'],
                },
                {
                  title: 'Event',
                  dataIndex: 'eventTitle',
                },
                {
                  title: 'Venue',
                  dataIndex: 'venue',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (s: string) => <StatusTag status={s as any} />,
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  render: (v: number) =>
                    `₹${Number(v).toLocaleString('en-IN')}`,
                },
              ]}
            />
          ) : (
            <Empty description="No bookings found" />
          )}
        </div>
      ),
    },
    {
      key: 'utilisation',
      label: 'Calendar Utilisation',
      children: (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Venue Utilisation
          </div>
          {utilisationData.length > 0 ? (
            utilisationData.map((v: any) => (
              <div key={v.venue} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {v.venue}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>
                    {v.bookedDays} days booked
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        v.utilisationPercent > 75 ? BRAND_RED : '#16a34a',
                    }}
                  >
                    {v.utilisationPercent}%
                  </span>
                </div>
                <Progress
                  percent={v.utilisationPercent}
                  showInfo={false}
                  strokeColor={
                    v.utilisationPercent > 75 ? BRAND_RED : '#16a34a'
                  }
                  trailColor="#f3f4f6"
                />
              </div>
            ))
          ) : (
            <Spin />
          )}
        </div>
      ),
    },
    {
      key: 'cancellations',
      label: 'Cancellations',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <div
                style={{
                  background: '#fef2f2',
                  borderRadius: 10,
                  padding: '20px 24px',
                  border: '1px solid #fecaca',
                }}
              >
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  TOTAL CANCELLATIONS
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#dc2626',
                  }}
                >
                  {cancellationsData?.total ?? 0}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: '#fef2f2',
                  borderRadius: 10,
                  padding: '20px 24px',
                  border: '1px solid #fecaca',
                }}
              >
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  REVENUE IMPACT
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#dc2626',
                  }}
                >
                  ₹
                  {Number(
                    cancellationsData?.revenueImpact ?? 0
                  ).toLocaleString('en-IN')}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: '#fafafa',
                  borderRadius: 10,
                  padding: '20px 24px',
                  border: '1px solid #f0f0f0',
                }}
              >
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  CANCELLATION RATE
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#6b7280',
                  }}
                >
                  {totals.totalBookings > 0
                    ? (
                        ((totals.cancelled ?? 0) / totals.totalBookings) *
                        100
                      ).toFixed(1)
                    : '0'}
                  %
                </div>
              </div>
            </Col>
          </Row>
          {cancellationsData?.byReason && cancellationsData.byReason.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                By Reason
              </div>
              {cancellationsData.byReason.map(
                (r: any) => (
                  <div
                    key={r.reason}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{ width: 160, fontSize: 13, color: '#374151' }}
                    >
                      {r.reason}
                    </span>
                    <Progress
                      percent={
                        (r.count / (cancellationsData.total ?? 1)) * 100
                      }
                      showInfo={false}
                      style={{ flex: 1 }}
                      strokeColor={BRAND_RED}
                      trailColor="#f3f4f6"
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#374151',
                        width: 20,
                      }}
                    >
                      {r.count}
                    </span>
                  </div>
                )
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'conversion',
      label: 'Conversion Time',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #f0f0f0',
                  padding: '20px 24px',
                }}
              >
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  AVG. CONVERSION TIME
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#111827',
                  }}
                >
                  {conversionData?.averageDays ?? 0}{' '}
                  <span style={{ fontSize: 16, color: '#6b7280' }}>days</span>
                </div>
              </div>
            </Col>
          </Row>
          {conversionData?.byStage && conversionData.byStage.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                By Stage
              </div>
              {conversionData.byStage.map(
                (s: any) => (
                  <div
                    key={s.stage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{ width: 200, fontSize: 13, color: '#374151' }}
                    >
                      {s.stage}
                    </span>
                    <Progress
                      percent={(s.days / (conversionData.averageDays ?? 1)) * 100}
                      showInfo={false}
                      style={{ flex: 1 }}
                      strokeColor="#6366f1"
                      trailColor="#f3f4f6"
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        width: 50,
                      }}
                    >
                      {s.days}d
                    </span>
                  </div>
                )
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '20px 28px',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
          Reports & Audit Trail
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          Business insights, conversion analytics, and audit logs.
        </div>
      </div>
      <div style={{ padding: 28 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #f0f0f0',
            padding: '0 24px',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;
