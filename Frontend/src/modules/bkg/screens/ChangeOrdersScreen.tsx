import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeOrderApi, BookingApi } from '../services';
import { ChangeOrderStatusTag } from '../components/SharedComponents';

const BRAND_RED = '#c7361a';

const ChangeOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    BookingApi.list()
      .then((res) => setBookings(res?.data || []))
      .catch(() => setBookings([]));
  }, []);

  const { data: changeOrdersRes = { data: [] }, isLoading } = useQuery({
    queryKey: ['changeorders'],
    queryFn: ChangeOrderApi.getAll,
    refetchInterval: 30000,
  });

  const changeOrders = changeOrdersRes?.data || [];

  const createMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
      ChangeOrderApi.create(bookingId, data),
    onSuccess: (_res: any, variables) => {
      message.success('Change order submitted');
      setDrawerOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['changeorders'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
      // Jump to the client's profile so the new change order is visible in context.
      navigate(`/bkg/bookings/${variables.bookingId}`);
    },
    onError: () => {
      message.error('Failed to submit change order');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ changeOrderId, data }: { changeOrderId: string; data: any }) =>
      ChangeOrderApi.update(changeOrderId, data),
    onSuccess: () => {
      message.success('Change order updated');
      setDrawerOpen(false);
      setEditingChangeOrder(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['changeorders'] });
    },
    onError: () => {
      message.error('Failed to update change order');
    },
  });

  const openAddDrawer = () => {
    setEditingChangeOrder(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: any) => {
    setEditingChangeOrder(record);
    form.setFieldsValue({
      bookingId: record.bookingId,
      title: record.title,
      description: record.description,
      amountDelta: Number(record.amountDelta),
      requestedBy: record.requestedBy,
      status: record.status,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingChangeOrder) {
      updateMutation.mutate({
        changeOrderId: editingChangeOrder.id,
        data: {
          title: values.title,
          description: values.description,
          amountDelta: values.amountDelta,
          requestedBy: values.requestedBy,
          status: values.status,
          approvedBy: values.status === 'APPROVED' ? 'Operations' : undefined,
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
        title: values.title,
        description: values.description,
        amountDelta: values.amountDelta,
        requestedBy: values.requestedBy,
      },
    });
  };

  const handleQuickStatus = (record: any, status: 'APPROVED' | 'REJECTED') => {
    updateMutation.mutate({
      changeOrderId: record.id,
      data: { status, approvedBy: status === 'APPROVED' ? 'Operations' : undefined },
    });
  };

  const columns = [
    {
      title: 'Booking',
      dataIndex: ['booking', 'bookingRef'],
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
      title: 'Event',
      dataIndex: ['booking', 'eventTitle'],
    },
    {
      title: 'Change',
      dataIndex: 'title',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Impact',
      dataIndex: 'amountDelta',
      render: (v: number) => (
        <span
          style={{
            color: v >= 0 ? '#16a34a' : '#dc2626',
            fontWeight: 700,
          }}
        >
          {v >= 0 ? '+' : ''}${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <ChangeOrderStatusTag status={s as 'PENDING' | 'APPROVED' | 'REJECTED'} />
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (v: string) =>
        new Date(v).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space size={8}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
            Edit
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="link"
                style={{ color: '#16a34a' }}
                icon={<CheckOutlined />}
                onClick={() => handleQuickStatus(record, 'APPROVED')}
              >
                Approve
              </Button>
              <Button
                size="small"
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleQuickStatus(record, 'REJECTED')}
              >
                Reject
              </Button>
            </>
          )}
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
            Change Orders
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Track all booking modifications and scope changes.
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
          New Change Order
        </Button>
      </div>
      <div style={{ padding: 28 }}>
        {changeOrders.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              padding: 40,
            }}
          >
            <Empty description="No change orders" />
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
              dataSource={changeOrders}
              columns={columns}
              rowKey="id"
              size="middle"
            />
          </div>
        )}
      </div>
      <Drawer
        title={editingChangeOrder ? 'Edit Change Order' : 'New Change Order'}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingChangeOrder(null);
        }}
        width={440}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Booking"
            name="bookingId"
            rules={[{ required: true, message: 'Booking is required' }]}
          >
            <Select
              size="large"
              placeholder="Select booking"
              showSearch
              optionFilterProp="label"
              disabled={!!editingChangeOrder}
              options={bookings.map((booking: any) => ({
                value: booking.id,
                label: `${booking.bookingRef} - ${booking.client?.name || 'Unknown Client'}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input
              size="large"
              placeholder="Brief description of the change"
            />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Detailed description..."
            />
          </Form.Item>
          <Form.Item label="Amount Impact ($)" name="amountDelta">
            <InputNumber style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item
            label="Requested By"
            name="requestedBy"
            rules={[{ required: true, message: 'Requester name is required' }]}
          >
            <Input size="large" />
          </Form.Item>
          {editingChangeOrder && (
            <Form.Item label="Status" name="status">
              <Select
                size="large"
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </Form.Item>
          )}
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
            {editingChangeOrder ? 'Save Changes' : 'Submit Change Order'}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default ChangeOrdersScreen;
