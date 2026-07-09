import React from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Spin,
  Empty,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { HoldApi } from '../services';

const BRAND_RED = '#c7361a';

const HoldManagementScreen: React.FC = () => {
  const { data: holdsRes = { data: [] }, isLoading } = useQuery({
    queryKey: ['holds'],
    queryFn: HoldApi.list,
  });

  const holds = holdsRes?.data || [];

  const expiringHolds = holds.filter((h: any) => {
    const expiresAt = new Date(h.expiresAt);
    const now = new Date();
    const hoursUntilExpiry =
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return h.status === 'ACTIVE' && hoursUntilExpiry < 2 && hoursUntilExpiry > 0;
  });

  const columns = [
    {
      title: 'Booking',
      dataIndex: ['booking', 'bookingRef'],
      render: (v: string) => (
        <span style={{ color: BRAND_RED, fontWeight: 700 }}>#{v}</span>
      ),
    },
    {
      title: 'Client',
      dataIndex: ['booking', 'client', 'name'],
    },
    {
      title: 'Event',
      dataIndex: ['booking', 'eventTitle'],
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
    },
    {
      title: 'Held By',
      dataIndex: 'heldBy',
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      render: (v: string) =>
        new Date(v).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'orange' : s === 'RELEASED' ? 'blue' : 'red'}>
          {s}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_: unknown, record: { status: string }) => (
        <Space>
          <Button size="small" disabled={record.status !== 'ACTIVE'}>
            Release
          </Button>
          <Button
            size="small"
            type="primary"
            style={{ background: BRAND_RED, border: 'none' }}
            disabled={record.status !== 'ACTIVE'}
          >
            Convert
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

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
          Hold Management
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          Manage active holds and expiring reservations.
        </div>
      </div>
      <div style={{ padding: 28 }}>
        {expiringHolds.length > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message={`${expiringHolds.length} hold${expiringHolds.length === 1 ? '' : 's'} expiring in less than 2 hours`}
            description={expiringHolds
              .map(
                (h: any) =>
                  `${h.booking.bookingRef} – ${h.booking.eventTitle} (${h.booking.client.name}) expires at ${new Date(h.expiresAt).toLocaleTimeString('en-IN')}`
              )
              .join('; ')}
            style={{ marginBottom: 20, borderRadius: 10 }}
          />
        )}

        {holds.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              padding: 40,
            }}
          >
            <Empty description="No active holds" />
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              overflow: 'hidden',
            }}
          >
            <Table
              dataSource={holds}
              columns={columns}
              rowKey="id"
              size="middle"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldManagementScreen;
