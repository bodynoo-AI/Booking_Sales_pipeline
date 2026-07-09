import React, { useState } from 'react';
import {
  Row,
  Col,
  Button,
  Card,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { BookingApi, DocumentApi } from '../services';
import { triggerBlobDownload } from '../hooks';
import { StatusTag } from '../components/SharedComponents';

const BRAND_RED = '#c7361a';

type DocType = 'confirmation' | 'work-order' | 'event-brief';

const DOC_TYPES: Array<{ label: string; type: DocType; prefix: string }> = [
  { label: 'Confirmation Letter', type: 'confirmation', prefix: 'confirmation-letter' },
  { label: 'Work Order', type: 'work-order', prefix: 'work-order' },
  { label: 'Event Brief', type: 'event-brief', prefix: 'event-brief' },
];

const HandoffScreen: React.FC = () => {
  const { data: bookingsRes = { data: [] }, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => BookingApi.list({ limit: 20 }),
  });
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const bookings = (bookingsRes?.data || []).slice(0, 5);

  const handleDownload = async (bookingId: string, bookingRef: string, type: DocType, prefix: string) => {
    const key = `${bookingId}-${type}`;
    setDownloadingKey(key);
    try {
      const response = await DocumentApi.generate(bookingId, type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      triggerBlobDownload(blob, `${prefix}-${bookingRef}.pdf`);
    } catch {
      message.error('Failed to generate document');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleSubmitHandoff = async (bookingId: string) => {
    setSubmittingId(bookingId);
    try {
      await BookingApi.submitHandoff(bookingId, {
        handoffTo: 'Operations',
        notes: 'Documents & handoff submitted from Documents & Handoff screen',
        checklist: [],
        handoffAt: new Date().toISOString(),
      });
      message.success('Handoff submitted');
    } catch {
      message.error('Failed to submit handoff');
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (bookings.length === 0) {
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
            Documents & Handoff
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Generate booking documents and coordinate event handoffs.
          </div>
        </div>
        <div style={{ padding: 28 }}>
          <Empty description="No bookings available" />
        </div>
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
          Documents & Handoff
        </div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>
          Generate booking documents and coordinate event handoffs.
        </div>
      </div>
      <div style={{ padding: 28 }}>
        {bookings.map((b: any) => (
          <Card
            key={b.id}
            style={{
              marginBottom: 16,
              borderRadius: 14,
              borderColor: '#f0f0f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <span
                  style={{
                    color: BRAND_RED,
                    fontWeight: 700,
                    fontSize: 13,
                    marginRight: 10,
                  }}
                >
                  #{b.bookingRef}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#111827',
                  }}
                >
                  {b.eventTitle}
                </span>
                <span
                  style={{
                    color: '#6b7280',
                    fontSize: 12,
                    marginLeft: 10,
                  }}
                >
                  {b.client.name}
                </span>
              </div>
              <StatusTag status={b.status} />
            </div>
            <Row gutter={12}>
              {DOC_TYPES.map((doc) => (
                <Col key={doc.type} span={8}>
                  <div
                    style={{
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div style={{ color: BRAND_RED, fontSize: 16 }}>
                        <FileTextOutlined />
                      </div>
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 12.5,
                        }}
                      >
                        {doc.label}
                      </span>
                    </div>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      style={{ borderRadius: 6 }}
                      loading={downloadingKey === `${b.id}-${doc.type}`}
                      onClick={() => handleDownload(b.id, b.bookingRef, doc.type, doc.prefix)}
                    />
                  </div>
                </Col>
              ))}
            </Row>
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                icon={<SendOutlined />}
                type="primary"
                size="small"
                loading={submittingId === b.id}
                onClick={() => handleSubmitHandoff(b.id)}
                style={{
                  background: BRAND_RED,
                  border: 'none',
                  borderRadius: 8,
                }}
              >
                Submit Handoff
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HandoffScreen;
