import React, { useEffect, useState } from 'react';
import {
  Form,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Alert,
  Spin,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { ConflictApi, VenueApi } from '../services';

const BRAND_RED = '#c7361a';

const ConflictScreen: React.FC = () => {
  const [form] = Form.useForm();
  const [venueOptions, setVenueOptions] = useState<{ value: string; label: string }[]>([]);
  const [results, setResults] = useState<{
    conflicts: any[];
    hasConflict: boolean;
  } | null>(null);

  const checkMutation = useMutation({
    mutationFn: ConflictApi.check,
    onSuccess: (data) => {
      setResults({
        conflicts: data?.data || [],
        hasConflict: (data?.data || []).length > 0,
      });
    },
  });

  useEffect(() => {
    const loadVenueOptions = async () => {
      try {
        const response = await VenueApi.list();
        const venues = (response.data || []).map((venue: any) => ({
          value: venue.name,
          label: venue.name,
        }));
        setVenueOptions(venues);
      } catch {
        setVenueOptions([]);
      }
    };

    void loadVenueOptions();
  }, []);

  const handleCheckConflicts = (values: any) => {
    checkMutation.mutate({
      venue: values.venue,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      excludeBookingId: values.excludeBookingId || undefined,
    });
  };

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
          Conflict Checker
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          Check venue availability and detect booking conflicts.
        </div>
      </div>
      <div style={{ padding: 28, maxWidth: 600 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #f0f0f0',
            padding: 28,
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCheckConflicts}
          >
            <Form.Item
              label="Venue"
              name="venue"
              rules={[{ required: true, message: 'Please select a venue' }]}
            >
              <Select size="large" placeholder="Select venue" options={venueOptions} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Start Date"
                  name="startDate"
                  rules={[
                    {
                      required: true,
                      message: 'Please select start date',
                    },
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[
                    { required: true, message: 'Please select end date' },
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Exclude Booking ID (optional)"
              name="excludeBookingId"
            >
              <input
                type="text"
                placeholder="e.g. EH-8829"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                }}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                background: BRAND_RED,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
              }}
              loading={checkMutation.isPending}
            >
              Check Availability
            </Button>
          </Form>

          {results && (
            <div style={{ marginTop: 24 }}>
              {results.hasConflict ? (
                <div>
                  <Alert
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                    message="Conflicts Detected"
                    description={`Found ${results.conflicts.length} conflicting booking(s). Please choose different dates or venue.`}
                    style={{ borderRadius: 10, marginBottom: 16 }}
                  />
                  {results.conflicts.map((conflict: any) => (
                    <div
                      key={conflict.id}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <strong>{conflict.description}</strong>
                      <div style={{ color: '#6b7280', marginTop: 4 }}>
                        {new Date(conflict.startDate).toLocaleDateString()} –{' '}
                        {new Date(conflict.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  message="No Conflicts Found"
                  description="The venue is available for the selected dates. You can proceed with the booking."
                  style={{ borderRadius: 10 }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictScreen;
