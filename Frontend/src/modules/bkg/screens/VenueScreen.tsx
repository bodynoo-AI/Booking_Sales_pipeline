import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Table, message, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { VenueApi } from '../services';

const { Option } = Select;
const { Title, Text } = Typography;

interface VenueRecord {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  capacity?: number | null;
  type: string;
  description?: string | null;
  status: string;
  createdAt: string;
}

const VenueScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const response = await VenueApi.list();
      setVenues((response.data || []) as VenueRecord[]);
    } catch {
      message.error('Unable to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVenues();
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await VenueApi.create({
        name: String(values.name || '').trim(),
        city: values.city ? String(values.city) : undefined,
        address: values.address ? String(values.address) : undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        type: values.type ? String(values.type) : 'General',
        description: values.description ? String(values.description) : undefined,
        status: values.status ? String(values.status) : 'ACTIVE',
      });
      message.success('Venue added successfully');
      form.resetFields();
      await loadVenues();
    } catch {
      message.error('Failed to create venue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>Venue Management</Title>
        <Text type="secondary">Create venues once and reuse them across bookings and conflict checks.</Text>
      </div>

      <Card title="Add New Venue" style={{ marginBottom: 24, borderRadius: 12 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Venue Name" name="name" rules={[{ required: true, message: 'Venue name is required' }]}> 
            <Input placeholder="e.g. Grand Ballroom" />
          </Form.Item>
          <Form.Item label="Venue Type" name="type">
            <Select placeholder="Select type" defaultValue="General">
              <Option value="General">General</Option>
              <Option value="Ballroom">Ballroom</Option>
              <Option value="Lounge">Lounge</Option>
              <Option value="Terrace">Terrace</Option>
              <Option value="Conference">Conference</Option>
            </Select>
          </Form.Item>
          <Form.Item label="City" name="city">
            <Input placeholder="City" />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input placeholder="Venue address" />
          </Form.Item>
          <Form.Item label="Capacity" name="capacity">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional details" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
            Save Venue
          </Button>
        </Form>
      </Card>

      <Card title="Saved Venues" style={{ borderRadius: 12 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={venues}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Type', dataIndex: 'type', key: 'type' },
            { title: 'City', dataIndex: 'city', key: 'city' },
            { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
            { title: 'Status', dataIndex: 'status', key: 'status' },
          ]}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default VenueScreen;
