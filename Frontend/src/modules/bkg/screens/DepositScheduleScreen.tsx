import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Button,
  Table,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Drawer,
  Space,
  message,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepositApi, BookingApi } from '../services';
import { DepositStatusTag } from '../components/SharedComponents';

const BRAND_RED = '#c7361a';

const DepositScheduleScreen: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await BookingApi.list();

      if (response?.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Failed to load bookings', error);
    }
  };

  const { data: depositsRes = { data: [] }, isLoading } = useQuery({
    queryKey: ['deposits', 'all'],
    queryFn: DepositApi.getAll,
    // Keep this screen live: refresh periodically in addition to the
    // socket-driven invalidation wired up in useBkgSocket.
    refetchInterval: 30000,
  });

  const deposits = depositsRes?.data || [];

  const createMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
      DepositApi.create(bookingId, data),
    onSuccess: (res: any, variables) => {
      message.success('Deposit added successfully');
      setDrawerOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
      // Show the client's profile right away so the new deposit is visible
      // in context, instead of leaving the user on this list screen.
      navigate(`/bkg/bookings/${variables.bookingId}`);
    },
    onError: () => {
      message.error('Failed to add deposit');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ depositId, data }: { depositId: string; data: any }) =>
      DepositApi.update(depositId, data),
    onSuccess: (_res: any, variables: any) => {
      message.success('Deposit updated successfully');
      setDrawerOpen(false);
      setEditingDeposit(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      if (editingDeposit?.bookingId) {
        queryClient.invalidateQueries({ queryKey: ['booking', editingDeposit.bookingId] });
      }
    },
    onError: () => {
      message.error('Failed to update deposit');
    },
  });

  const openAddDrawer = () => {
    setEditingDeposit(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: any) => {
    setEditingDeposit(record);
    form.setFieldsValue({
      bookingId: record.bookingId,
      amount: Number(record.amount),
      dueDate: record.dueDate ? dayjs(record.dueDate) : undefined,
      paidDate: record.paidDate ? dayjs(record.paidDate) : undefined,
      status: record.status,
      method: record.method,
      reference: record.reference,
      notes: record.notes,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingDeposit) {
      updateMutation.mutate({
        depositId: editingDeposit.id,
        data: {
          amount: values.amount,
          dueDate: values.dueDate?.toISOString?.() ?? values.dueDate,
          paidDate: values.paidDate ? values.paidDate.toISOString?.() ?? values.paidDate : null,
          status: values.status,
          method: values.method,
          reference: values.reference,
          notes: values.notes,
        },
      });
      return;
    }

    if (!values.bookingId) {
      message.error('Please select a booking');
      return;
    }
    createMutation.mutate({
      bookingId: values.bookingId,
      data: {
        amount: values.amount,
        dueDate: values.dueDate.toISOString(),
        paidDate: values.paidDate ? values.paidDate.toISOString() : null,
        method: values.method,
        reference: values.reference,
        notes: values.notes,
      },
    });
  };

  const columns = [
    {
      title: 'Booking',
      dataIndex: 'bookingRef',
      render: (v: string, record: any) => (
        <a
          style={{ color: BRAND_RED, fontWeight: 700 }}
          onClick={() => record.bookingId && navigate(`/bkg/bookings/${record.bookingId}`)}
        >
          #{v}
        </a>
      ),
    },
    {
      title: 'Client',
      dataIndex: ['booking', 'client', 'name'],
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (v: number) => (
        <strong>₹{Number(v).toLocaleString('en-IN')}</strong>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      render: (v: string) =>
        new Date(v).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidDate',
      render: (v?: string) =>
        v
          ? new Date(v).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '—',
    },
    {
      title: 'Method',
      dataIndex: 'method',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <DepositStatusTag status={s as 'PENDING' | 'PAID' | 'OVERDUE'} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space size={8}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const totalPaid = deposits
    .filter((d: any) => d.status === 'PAID')
    .reduce((a: number, d: any) => a + Number(d.amount || 0), 0);
  const totalDue = deposits.reduce(
    (a: number, d: any) => a + Number(d.amount || 0),
    0
  );
  const totalOverdue = deposits
    .filter((d: any) => d.status === 'OVERDUE')
    .reduce((a: number, d: any) => a + Number(d.amount || 0), 0);

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
            Revenue & Deposits
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Track all deposit schedules and payment statuses.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddDrawer}
          style={{
            background: BRAND_RED,
            border: 'none',
            borderRadius: 8,
          }}
        >
          Add Deposit
        </Button>
      </div>

      <div style={{ padding: 28 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[
            {
              title: 'Total Collected',
              value: `$${totalPaid.toLocaleString('en-IN')}`,
              color: '#16a34a',
            },
            {
              title: 'Outstanding',
              value: `$${(totalDue - totalPaid).toLocaleString('en-IN')}`,
              color: '#d97706',
            },
            {
              title: 'Overdue',
              value: `$${totalOverdue.toLocaleString('en-IN')}`,
              color: '#dc2626',
            },
          ].map((s) => (
            <Col key={s.title} span={8}>
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
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {s.title}
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

        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
          }}
        >
          <Table
            dataSource={deposits}
            columns={columns}
            rowKey="id"
            size="middle"
          />
        </div>
      </div>

      <Drawer
        title={editingDeposit ? 'Edit Deposit Entry' : 'Add Deposit Entry'}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingDeposit(null);
        }}
        width={420}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Booking"
            name="bookingId"
            rules={[{ required: true, message: 'Please select a booking' }]}
          >
            <Select
              placeholder="Select Booking"
              showSearch
              optionFilterProp="label"
              disabled={!!editingDeposit}
              options={bookings.map((booking: any) => ({
                value: booking.id,
                label: `${booking.bookingRef} - ${booking.client?.name || 'Unknown Client'}`
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Amount (₹)"
            name="amount"
            rules={[{ required: true, message: 'Amount is required' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              size="large"
            />
          </Form.Item>
          <Form.Item
            label="Due Date"
            name="dueDate"
            rules={[{ required: true, message: 'Due date is required' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item label="Paid Date" name="paidDate">
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>
          {editingDeposit && (
            <Form.Item label="Status" name="status">
              <Select
                size="large"
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'PAID', label: 'Paid' },
                  { value: 'OVERDUE', label: 'Overdue' },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item label="Payment Method" name="method">
            <Select
              size="large"
              placeholder="Select payment method"
              allowClear
              options={[
                { value: 'bank', label: 'Bank Transfer' },
                { value: 'card', label: 'Credit Card' },
                { value: 'cash', label: 'Cash' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Reference" name="reference">
            <Input size="large" placeholder="Payment reference number" />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea placeholder="Additional notes..." rows={2} />
          </Form.Item>
          <Button
            type="primary"
            block
            size="large"
            htmlType="submit"
            style={{
              background: BRAND_RED,
              border: 'none',
              borderRadius: 8,
            }}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editingDeposit ? 'Save Changes' : 'Save Deposit'}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default DepositScheduleScreen;
