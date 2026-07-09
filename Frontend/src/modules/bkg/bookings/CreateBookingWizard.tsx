import React, { useState, useEffect } from 'react';
import { Steps, Button, Form, Input, Select, DatePicker, InputNumber, Breadcrumb, message, Card, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { BookingApi, VenueApi } from '../services';
import { useQueryClient } from '@tanstack/react-query';

const { Option } = Select;
const BRAND_RED = '#c7361a';

const STEPS = ['Client Info', 'Event Details', 'Venue & Dates', 'Review'];

const CreateBookingWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [venueOptions, setVenueOptions] = useState<string[]>([]);
  const [loadingBooking, setLoadingBooking] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const next = async () => {
    try {
      const values = await form.validateFields();
      setFormData((prev) => ({ ...prev, ...values }));
      setCurrent((c) => c + 1);
    } catch {
      // validation handled by antd
    }
  };

  const prev = () => setCurrent((c) => c - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = {
        ...formData,
        ...form.getFieldsValue(),
      };

      const payload = {
        ...values,
        venueType: values.venue ?? values.venueType ?? 'Grand Ballroom',
        startDate: values.startDate?.toISOString?.() ?? values.startDate,
        endDate: values.endDate?.toISOString?.() ?? values.endDate,
      };

      let bookingId = id;
      if (isEditMode && id) {
        const res = await BookingApi.update(id, payload as any);
        bookingId = res?.data?.id ?? id;
        message.success('Booking updated successfully');
      } else {
        const res = await BookingApi.create(payload as any);
        bookingId = res?.data?.id ?? bookingId;
        message.success('Booking created successfully');
      }

      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (bookingId) {
        await queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      }

      // Land on the client's profile (booking details) so the newly
      // created/edited record is immediately visible, instead of just the list.
      if (bookingId) {
        navigate(`/bkg/bookings/${bookingId}`);
      } else {
        navigate('/bkg/bookings');
      }
    } catch (error) {
      message.error(isEditMode ? 'Failed to update booking' : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bookingRes, venueRes] = await Promise.all([BookingApi.list(), VenueApi.list()]);
        const bookings = bookingRes.data || [];
        const venueList = venueRes.data || [];
        const venues = Array.from(
          new Set([
            ...bookings.map((b: any) => b.venue).filter(Boolean),
            ...venueList.map((v: any) => v.name).filter(Boolean),
          ]),
        );
        if (mounted) setVenueOptions(venues);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // In edit mode, load the existing booking and prefill every step of the form.
  useEffect(() => {
    if (!isEditMode || !id) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingBooking(true);
        const res = await BookingApi.getById(id);
        const booking: any = res?.data;
        if (!booking || !mounted) return;

        const prefill: Record<string, unknown> = {
          clientName: booking.client?.name,
          clientEmail: booking.client?.email,
          clientPhone: booking.client?.phone,
          eventTitle: booking.eventTitle,
          quotationId: booking.quotationId ?? undefined,
          guestCount: booking.guestCount ?? undefined,
          revenue: Number(booking.revenue) || 0,
          notes: booking.notes ?? undefined,
          venue: booking.venue,
          startDate: booking.startDate ? dayjs(booking.startDate) : undefined,
          endDate: booking.endDate ? dayjs(booking.endDate) : undefined,
        };

        setFormData(prefill);
        form.setFieldsValue(prefill);
      } catch {
        message.error('Failed to load booking for editing');
      } finally {
        if (mounted) setLoadingBooking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEditMode, form]);

  const stepContent = [
    // Step 0: Client Info
    <div key="client">
      <Form.Item label="Client Name" name="clientName" rules={[{ required: true, message: 'Client name is required' }]}>
        <Input placeholder="Full name" size="large" style={{ borderRadius: 8 }} />
      </Form.Item>
      <Form.Item label="Email" name="clientEmail" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
        <Input placeholder="client@example.com" size="large" style={{ borderRadius: 8 }} />
      </Form.Item>
      <Form.Item
        label="Phone"
        name="clientPhone"
        rules={[
          {
            pattern: /^\d{10}$/,
            message: 'Phone number must be exactly 10 digits',
          },
        ]}
      >
        <Input
          placeholder="10-digit mobile number"
          size="large"
          style={{ borderRadius: 8 }}
          maxLength={10}
          inputMode="numeric"
          onKeyDown={(e) => {
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
            if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key) && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
            form.setFieldValue('clientPhone', digitsOnly);
          }}
        />
      </Form.Item>
    </div>,

    // Step 1: Event Details
    <div key="event">
      <Form.Item label="Event Title" name="eventTitle" rules={[{ required: true, message: 'Event title is required' }]}>
        <Input placeholder="e.g. Annual Gala Dinner" size="large" style={{ borderRadius: 8 }} />
      </Form.Item>
      <Form.Item label="Quotation ID" name="quotationId" tooltip="Reference ID of the sales quotation this booking was converted from">
        <Input placeholder="e.g. QT-2026-00123" size="large" style={{ borderRadius: 8 }} />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Expected Guest Count" name="guestCount">
            <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Revenue ($)" name="revenue" rules={[{ required: true, message: 'Revenue is required' }]}>
            <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} size="large" prefix="$" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Notes" name="notes">
        <Input.TextArea rows={3} placeholder="Any special requirements..." style={{ borderRadius: 8 }} />
      </Form.Item>
    </div>,

    // Step 2: Venue & Dates
    <div key="venue">
        <Form.Item label="Venue" name="venue" rules={[{ required: true, message: 'Please select a venue' }]}>
        <Select size="large" placeholder="Select venue" style={{ borderRadius: 8 }}>
          {venueOptions.length === 0 ? (
            <Option value="Grand Ballroom">Grand Ballroom</Option>
          ) : (
            venueOptions.map((v) => (
              <Option key={v} value={v}>{v}</Option>
            ))
          )}
        </Select>
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: 'Start date required' }]}>
            <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="End Date" name="endDate" rules={[{ required: true, message: 'End date required' }]}>
            <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large" />
          </Form.Item>
        </Col>
      </Row>
    </div>,

    // Step 3: Review
    <div key="review">
      <div
        style={{
          background: '#fafafa',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>
          Booking Summary
        </div>
        {Object.entries(formData).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 13.5,
            }}
          >
            <span style={{ color: '#6b7280', fontWeight: 500, textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span style={{ color: '#111827', fontWeight: 600 }}>{String(value)}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(isEditMode && id ? `/bkg/bookings/${id}` : '/bkg/bookings')}
            style={{ borderRadius: 8, border: '1.5px solid #e5e7eb' }}
          >
            Back
          </Button>
          <Breadcrumb
            items={[
              { title: 'Admin' },
              { title: <span style={{ color: BRAND_RED }}>Master Register</span>, onClick: () => navigate('/bkg/bookings') },
              { title: isEditMode ? 'Edit Booking' : 'New Booking' },
            ]}
          />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
          {isEditMode ? 'Edit Booking' : 'Create New Booking'}
        </div>
      </div>

      {loadingBooking ? (
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
      <div style={{ padding: 28, maxWidth: 700, margin: '0 auto' }}>
        {/* Steps Indicator */}
        <Steps
          current={current}
          items={STEPS.map((s) => ({ title: s }))}
          style={{ marginBottom: 32 }}
          progressDot
        />

        {/* Form Card */}
        <Card
          style={{
            borderRadius: 14,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Form form={form} layout="vertical" size="middle">
            {stepContent[current]}
          </Form>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            onClick={prev}
            disabled={current === 0}
            style={{ borderRadius: 8, height: 40, padding: '0 20px' }}
          >
            Previous
          </Button>
          {current < STEPS.length - 1 ? (
            <Button
              type="primary"
              onClick={next}
              style={{
                background: BRAND_RED,
                border: 'none',
                borderRadius: 8,
                height: 40,
                padding: '0 28px',
                fontWeight: 700,
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              style={{
                background: '#16a34a',
                border: 'none',
                borderRadius: 8,
                height: 40,
                padding: '0 28px',
                fontWeight: 700,
              }}
            >
              {isEditMode ? 'Save Changes' : 'Create Booking'}
            </Button>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default CreateBookingWizard;
