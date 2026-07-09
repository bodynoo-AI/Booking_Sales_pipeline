import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Dropdown,
  Tooltip,
  Breadcrumb,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { StatusTag, ClientAvatar, BookingRef } from '../components/SharedComponents';
import type { Booking, BookingStatus, BookingFilters } from '../types';
import { useBookings } from '../hooks';

const { RangePicker } = DatePicker;
const { Option } = Select;

const BRAND_RED = '#c7361a';

const BookingListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BookingFilters>({ status: '', venueType: '' });
  const [searchVal, setSearchVal] = useState('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  const { data, isLoading } = useBookings({
    ...filters,
    search: searchVal || undefined,
    dateFrom: dateRange?.[0]?.toISOString?.(),
    dateTo: dateRange?.[1]?.toISOString?.(),
  });

  const bookings: Booking[] = data?.data || [];

  const columns: ColumnsType<Booking> = [
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Booking ID</span>,
      dataIndex: 'bookingRef',
      width: 120,
      render: (ref, record) => (
        <BookingRef ref_={ref} onClick={() => navigate(`/bkg/bookings/${record.bookingRef}`)} />
      ),
    },
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Client Name</span>,
      dataIndex: 'client',
      width: 180,
      render: (client, record) => (
        <ClientAvatar
          initials={client.avatarInitials}
          color={client.avatarColor}
          name={client.name}
          onClick={() => navigate(`/bkg/bookings/${record.bookingRef}`)}
        />
      ),
    },
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Event Title</span>,
      dataIndex: 'eventTitle',
      render: (title, record) => (
        <div>
          <div
            style={{ fontWeight: 500, color: '#111827', cursor: 'pointer', fontSize: 13.5 }}
            onClick={() => navigate(`/bkg/bookings/${record.bookingRef}`)}
          >
            {title}
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Venue</span>,
      dataIndex: 'venue',
      width: 160,
      render: (v) => <span style={{ color: '#374151', fontSize: 13 }}>{v}</span>,
    },
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Dates</span>,
      dataIndex: 'startDate',
      width: 140,
      render: (_, record) => {
        const start = new Date(record.startDate);
        const end = new Date(record.endDate);
        const startFmt = `${start.toLocaleString('en-IN', { month: 'short' })} ${start.getDate()}`;
        const endFmt = `${end.getDate()}`;
        return (
          <div>
            <div style={{ color: '#111827', fontWeight: 500, fontSize: 13 }}>
              {startFmt} – {endFmt}
            </div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
              {record.durationLabel}
            </div>
          </div>
        );
      },
    },
    {
      title: <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Status</span>,
      dataIndex: 'status',
      width: 130,
      render: (status: BookingStatus) => <StatusTag status={status} />,
    },
    {
      title: (
        <span style={{ color: '#374151', fontSize: 12, fontWeight: 700 }}>Revenue (₹)</span>
      ),
      dataIndex: 'revenue',
      width: 130,
      align: 'right',
      render: (v) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
          {v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => navigate(`/bkg/bookings/${record.bookingRef}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Booking',
                onClick: () => navigate(`/bkg/bookings/edit/${record.id}`),
              },
              { type: 'divider' },
              {
                key: 'hold',
                icon: <PauseCircleOutlined />,
                label: 'Place on Hold',
                disabled: record.status === 'ON_HOLD',
              },
              {
                key: 'cancel',
                icon: <StopOutlined />,
                label: 'Cancel Booking',
                danger: true,
                disabled: record.status === 'CANCELLED',
              },
            ],
          }}
        >
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              color: '#6b7280',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MoreOutlined />
          </button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Breadcrumb
            items={[{ title: 'Admin' }, { title: <span style={{ color: BRAND_RED }}>Master Register</span> }]}
            style={{ marginBottom: 4 }}
          />
          <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 2 }}>
            Master Booking Register
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Real-time overview of all high-value event reservations and active schedules.
          </div>
        </div>
        <Space size={10}>
          <Button
            icon={<ExportOutlined />}
            style={{
              borderRadius: 8,
              border: '1.5px solid #d1d5db',
              color: '#374151',
              fontWeight: 600,
              height: 38,
            }}
          >
            Export
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/bkg/bookings/new')}
            style={{
              background: BRAND_RED,
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              height: 38,
              boxShadow: '0 2px 8px rgba(199,54,26,0.3)',
            }}
          >
            New Booking
          </Button>
        </Space>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '20px 28px',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #f0f0f0',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 2fr',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 8 }}>
            SEARCH CATALOG
          </div>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="By ID, Client or Venue..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{ borderRadius: 8, border: '1.5px solid #e5e7eb', height: 38 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 8 }}>
            STATUS
          </div>
          <Select
            value={filters.status || ''}
            onChange={(v) => setFilters((f) => ({ ...f, status: v as BookingStatus | '' }))}
            style={{ width: '100%', height: 38 }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'TENTATIVE', label: 'Tentative' },
              { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'IN_PROGRESS', label: 'In-Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 8 }}>
            VENUE TYPE
          </div>
          <Select
            value={filters.venueType || ''}
            onChange={(v) => setFilters((f) => ({ ...f, venueType: v as import('../types').VenueType | '' }))}
            style={{ width: '100%', height: 38 }}
          >
              <Option value="">All Venues</Option>
              {[...new Set(bookings.map((b) => b.venue).filter(Boolean))].map((v) => (
                <Option key={v} value={v}>
                  {v}
                </Option>
              ))}
          </Select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 8 }}>
            DATE RANGE
          </div>
          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range as [any, any] | null)}
            style={{ width: '100%', height: 38, borderRadius: 8 }}
            format="dd-MM-yyyy"
            placeholder={['dd-mm-yyyy', 'dd-mm-yyyy']}
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 28px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
          }}
        >
          <Table
            columns={columns}
            dataSource={bookings}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              total: bookings.length,
              showSizeChanger: false,
              style: { padding: '12px 20px' },
            }}
            rowClassName={() => 'bkg-table-row'}
            onRow={(record) => ({
              onClick: () => navigate(`/bkg/bookings/${record.bookingRef}`),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: <Empty description="No bookings found" style={{ padding: '40px 0' }} />,
            }}
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>

      {/* ── Floating Action Button ─────────────────────────────────────────── */}
      <Tooltip title="New Booking" placement="left">
        <button
          onClick={() => navigate('/bkg/bookings/new')}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: BRAND_RED,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 22,
            boxShadow: '0 4px 16px rgba(199,54,26,0.4)',
            zIndex: 200,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          <PlusOutlined />
        </button>
      </Tooltip>

      <style>{`
        .bkg-table-row:hover td { background: #fdf7f5 !important; }
        .ant-table-thead > tr > th { background: #fff !important; border-bottom: 2px solid #f0f0f0 !important; }
        .ant-table-cell { padding: 16px 16px !important; }
      `}</style>
    </div>
  );
};

export default BookingListScreen;
