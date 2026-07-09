import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Alert,
  Spin,
  Empty,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingApi } from '../services';
import { StatusTag } from '../components/SharedComponents';

const BRAND_RED = '#c7361a';

const CancellationsScreen: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: bookingsRes = { data: [] }, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => BookingApi.list(),
  });

  const bookings = (bookingsRes?.data || []).filter(
    (b: any) => b.status !== 'CANCELLED'
  );

  const cancelMutation = useMutation({
    mutationFn: (data: any) =>
      BookingApi.cancel(selectedBooking.id, data),
    onSuccess: () => {
      setModalOpen(false);
      setSelectedBooking(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleCancel = (booking: any) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    cancelMutation.mutate(values);
  };

  const columns = [
    {
      title: 'Booking',
      dataIndex: 'bookingRef',
      render: (v: string) => (
        <span style={{ color: BRAND_RED, fontWeight: 700 }}>#{v}</span>
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
      title: 'Revenue',
      dataIndex: 'revenue',
      render: (v: number) => `₹${Number(v).toLocaleString('en-IN')}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <StatusTag status={s as any} />,
    },
    {
      title: 'Action',
      render: (_: unknown, record: any) => (
        <Button
          danger
          size="small"
          onClick={() => handleCancel(record)}
        >
          Cancel Booking
        </Button>
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
          Cancellation Center
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          Process booking cancellations and manage refund policies.
        </div>
      </div>
      <div style={{ padding: 28 }}>
        <Alert
          type="warning"
          showIcon
          message="Cancellations cannot be undone. Ensure refund policies are reviewed before proceeding."
          style={{ marginBottom: 20, borderRadius: 10 }}
        />
        {bookings.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              padding: 40,
            }}
          >
            <Empty description="No active bookings to cancel" />
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
              dataSource={bookings}
              columns={columns}
              rowKey="id"
              size="middle"
            />
          </div>
        )}
      </div>

      <Modal
        title="Cancel Booking"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedBooking(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Cancellation Reason"
            name="reason"
            rules={[
              { required: true, message: 'Reason is required' },
              { min: 10, message: 'Please provide at least 10 characters' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Please provide a detailed reason for cancellation..."
            />
          </Form.Item>
          <Form.Item
            label="Refund Amount ($)"
            name="refundAmount"
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea
              rows={2}
              placeholder="Additional notes..."
            />
          </Form.Item>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              onClick={() => {
                setModalOpen(false);
                setSelectedBooking(null);
                form.resetFields();
              }}
            >
              Keep Booking
            </Button>
            <Button
              danger
              type="primary"
              htmlType="submit"
              loading={cancelMutation.isPending}
            >
              Confirm Cancellation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CancellationsScreen;
