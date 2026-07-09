import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Tabs,
  Button,
  Descriptions,
  Tag,
  Space,
  Timeline,
  Breadcrumb,
  Popconfirm,
  Table,
  Steps,
  message,
  Spin,
  Dropdown,
  Drawer,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileUnknownOutlined,
  SendOutlined,
  UploadOutlined,
  DeleteOutlined,
  MoreOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusTag, ClientAvatar, DepositStatusTag, ChangeOrderStatusTag } from '../components/SharedComponents';
import {
  useBooking,
  useTimeline,
  useConfirmBooking,
  useStartBooking,
  useCompleteBooking,
  useCancelBooking,
  useHoldBooking,
  useDeposits,
  useChangeOrders,
  useCreateDeposit,
  useUpdateDeposit,
  useCreateChangeOrder,
  useUpdateChangeOrder,
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  triggerBlobDownload,
} from '../hooks';
import { BookingApi, DocumentApi } from '../services';
import type { BookingStatus } from '../types';

const BRAND_RED = '#c7361a';

const STATUS_STEPS: BookingStatus[] = ['DRAFT', 'TENTATIVE', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

const getStatusStepIndex = (status?: BookingStatus) => {
  if (!status) return -1;
  const normalized = status === 'PENDING' ? 'DRAFT' : status;
  return STATUS_STEPS.indexOf(normalized as BookingStatus);
};

const BookingDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: bookingData,
    isLoading: bookingLoading,
  } = useBooking(id ?? '');
  const {
    data: timelineData,
    isLoading: timelineLoading,
  } = useTimeline(id ?? '');

  const confirmMutation = useConfirmBooking();
  const startMutation = useStartBooking();
  const completeMutation = useCompleteBooking();
  const cancelMutation = useCancelBooking();
  const holdMutation = useHoldBooking();
  const depositsQuery = useDeposits(id ?? '');
  const changeOrdersQuery = useChangeOrders(id ?? '');
  const createDepositMutation = useCreateDeposit(id ?? '');
  const updateDepositMutation = useUpdateDeposit(id ?? '');
  const createChangeOrderMutation = useCreateChangeOrder(id ?? '');
  const updateChangeOrderMutation = useUpdateChangeOrder(id ?? '');
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<any | null>(null);
  const [depositForm] = Form.useForm();

  const [changeOrderDrawerOpen, setChangeOrderDrawerOpen] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState<any | null>(null);
  const [changeOrderForm] = Form.useForm();

  const booking = bookingData?.data;
  const timeline = Array.isArray(timelineData?.data) ? timelineData.data : [];
  const [fallbackBooking, setFallbackBooking] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const tryFallback = async () => {
      if (!booking && id) {
        try {
          const res = await BookingApi.list({ search: id });
          if (mounted && res && Array.isArray(res.data) && res.data.length > 0) {
            setFallbackBooking(res.data[0]);
          }
        } catch {
          // ignore
        }
      }
    };
    tryFallback();
    return () => {
      mounted = false;
    };
  }, [id, booking]);

  const bookingToShow = booking ?? fallbackBooking;
  const isLoading = bookingLoading || timelineLoading;
  const documentsBookingId = bookingToShow?.id ?? '';
  const documentsQuery = useDocuments(documentsBookingId);
  const uploadDocumentMutation = useUploadDocument(documentsBookingId);
  const deleteDocumentMutation = useDeleteDocument(documentsBookingId);

  const handleAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      message.success(successMessage);
    } catch {
      message.error('Action failed. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!bookingToShow) {
    return (
      <div style={{ padding: 40 }}>
        No booking found
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/bkg/bookings/edit/${bookingToShow.id}`);
  };

  const bookingId = bookingToShow?.id ?? id ?? 'unknown';

  const handleDownloadClientPdf = async () => {
    try {
      const response = await BookingApi.downloadClientPdf(bookingId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      triggerBlobDownload(blob, `client-details-${bookingToShow.bookingRef || bookingId}.pdf`);
      message.success('Client details PDF downloaded');
    } catch {
      message.error('Failed to download PDF');
    }
  };

  const handleDownloadGenerated = async (
    type: 'confirmation' | 'work-order' | 'event-brief',
    filenamePrefix: string
  ) => {
    setGeneratingDoc(type);
    try {
      const response = await DocumentApi.generate(documentsBookingId, type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      triggerBlobDownload(blob, `${filenamePrefix}-${bookingToShow.bookingRef || bookingId}.pdf`);
      message.success('Document downloaded');
    } catch {
      message.error('Failed to generate document');
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    for (const file of files) {
      try {
        await uploadDocumentMutation.mutateAsync(file);
        message.success(`${file.name} uploaded`);
      } catch (error: any) {
        message.error(error?.response?.data?.message || `Failed to upload ${file.name}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadUploaded = async (docId: string, name: string) => {
    try {
      const response = await DocumentApi.download(docId);
      const blob = new Blob([response.data]);
      triggerBlobDownload(blob, name);
    } catch {
      message.error('Failed to download document');
    }
  };

  const handleDeleteUploaded = async (docId: string, name: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(docId);
      message.success(`${name} deleted`);
    } catch {
      message.error('Failed to delete document');
    }
  };

  // ── Deposit drawer handlers ─────────────────────────────────────────────
  const openAddDeposit = () => {
    setEditingDeposit(null);
    depositForm.resetFields();
    setDepositDrawerOpen(true);
  };

  const openEditDeposit = (deposit: any) => {
    setEditingDeposit(deposit);
    depositForm.setFieldsValue({
      amount: Number(deposit.amount),
      dueDate: deposit.dueDate ? dayjs(deposit.dueDate) : undefined,
      paidDate: deposit.paidDate ? dayjs(deposit.paidDate) : undefined,
      status: deposit.status,
      method: deposit.method,
      reference: deposit.reference,
      notes: deposit.notes,
    });
    setDepositDrawerOpen(true);
  };

  const handleDepositSubmit = async (values: any) => {
    const payload = {
      amount: values.amount,
      dueDate: values.dueDate?.toISOString?.() ?? values.dueDate,
      paidDate: values.paidDate ? values.paidDate.toISOString?.() ?? values.paidDate : null,
      status: values.status,
      method: values.method,
      reference: values.reference,
      notes: values.notes,
    };
    try {
      if (editingDeposit) {
        await updateDepositMutation.mutateAsync({ depositId: editingDeposit.id, data: payload });
        message.success('Deposit updated');
      } else {
        await createDepositMutation.mutateAsync(payload as any);
        message.success('Deposit entry added');
      }
      setDepositDrawerOpen(false);
      depositForm.resetFields();
      setEditingDeposit(null);
    } catch {
      message.error(editingDeposit ? 'Failed to update deposit' : 'Failed to add deposit');
    }
  };

  // ── Change order drawer handlers ────────────────────────────────────────
  const openAddChangeOrder = () => {
    setEditingChangeOrder(null);
    changeOrderForm.resetFields();
    setChangeOrderDrawerOpen(true);
  };

  const openEditChangeOrder = (co: any) => {
    setEditingChangeOrder(co);
    changeOrderForm.setFieldsValue({
      title: co.title,
      description: co.description,
      amountDelta: Number(co.amountDelta),
      requestedBy: co.requestedBy,
      status: co.status,
    });
    setChangeOrderDrawerOpen(true);
  };

  const handleChangeOrderSubmit = async (values: any) => {
    try {
      if (editingChangeOrder) {
        await updateChangeOrderMutation.mutateAsync({
          changeOrderId: editingChangeOrder.id,
          data: { ...values, approvedBy: values.status === 'APPROVED' ? 'Operations' : undefined },
        });
        message.success('Change order updated');
      } else {
        await createChangeOrderMutation.mutateAsync(values);
        message.success('Change order submitted');
      }
      setChangeOrderDrawerOpen(false);
      changeOrderForm.resetFields();
      setEditingChangeOrder(null);
    } catch {
      message.error(editingChangeOrder ? 'Failed to update change order' : 'Failed to submit change order');
    }
  };

  const handleQuickChangeOrderStatus = async (co: any, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateChangeOrderMutation.mutateAsync({
        changeOrderId: co.id,
        data: { status, approvedBy: status === 'APPROVED' ? 'Operations' : undefined },
      });
      message.success(`Change order ${status.toLowerCase()}`);
    } catch {
      message.error('Failed to update change order');
    }
  };

  const handleMarkDepositPaid = async (deposit: any) => {
    try {
      await updateDepositMutation.mutateAsync({
        depositId: deposit.id,
        data: { status: 'PAID', paidDate: new Date().toISOString() },
      });
      message.success('Deposit marked as paid');
    } catch {
      message.error('Failed to update deposit');
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType?: string | null, name?: string) => {
    const ext = (name || '').split('.').pop()?.toLowerCase();
    if (mimeType?.includes('pdf') || ext === 'pdf') return <FilePdfOutlined />;
    if (mimeType?.includes('image') || ['jpg', 'jpeg', 'png'].includes(ext || '')) return <FileImageOutlined />;
    if (mimeType?.includes('sheet') || ['xls', 'xlsx'].includes(ext || '')) return <FileExcelOutlined />;
    if (mimeType?.includes('word') || ['doc', 'docx'].includes(ext || '')) return <FileWordOutlined />;
    return <FileUnknownOutlined />;
  };

  const currentStepIndex = getStatusStepIndex(bookingToShow?.status as BookingStatus);

  const mockDeposits = [
    {
      id: 'd1',
      bookingId,
      amount: 6225,
      dueDate: '2024-09-15',
      paidDate: '2024-09-14',
      status: 'PAID' as const,
      method: 'Bank Transfer',
    },
    { id: 'd2', bookingId, amount: 6225, dueDate: '2024-10-01', status: 'PENDING' as const },
  ];

  const mockChangeOrders = [
    {
      id: 'co1',
      bookingId,
      title: 'AV Equipment Upgrade',
      description: 'Add 4K projection system',
      amountDelta: 1200,
      requestedBy: 'Client',
      status: 'APPROVED' as const,
      createdAt: '2024-09-20T10:00:00Z',
      updatedAt: '2024-09-21T10:00:00Z',
    },
    {
      id: 'co2',
      bookingId,
      title: 'Extra Tables',
      description: 'Add 10 round tables',
      amountDelta: 450,
      requestedBy: 'Venue Manager',
      status: 'PENDING' as const,
      createdAt: '2024-09-25T10:00:00Z',
      updatedAt: '2024-09-25T10:00:00Z',
    },
  ];

  const deposits = depositsQuery.data?.data ?? mockDeposits;
  const changeOrders = changeOrdersQuery.data?.data ?? mockChangeOrders;

  const mockTimeline = [
    { id: 't1', action: 'Booking Confirmed', description: 'Booking confirmed by admin', performedBy: 'Admin User', timestamp: '2024-09-15T10:00:00Z', status: 'CONFIRMED' as const },
    { id: 't2', action: 'Deposit Received', description: 'First deposit of $6,225 received', performedBy: 'Finance', timestamp: '2024-09-14T14:00:00Z' },
    { id: 't3', action: 'Booking Created', description: 'New booking enquiry submitted', performedBy: 'Sales', timestamp: '2024-09-01T10:00:00Z', status: 'PENDING' as const },
  ];

  const timelineItems = timeline.length > 0 ? timeline : mockTimeline;

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div style={{ padding: '20px 0' }}>
          {/* Progress Steps */}
          <div
            style={{
              background: '#fafafa',
              borderRadius: 10,
              padding: '20px 24px',
              marginBottom: 24,
            }}
          >
            <Steps
              current={currentStepIndex}
              status={bookingToShow.status === 'CANCELLED' ? 'error' : undefined}
              items={STATUS_STEPS.map((s) => ({
                title: s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' '),
              }))}
              style={{ maxWidth: 600 }}
            />
          </div>

          <Descriptions
            bordered
            column={{ xs: 1, sm: 2, md: 3 }}
            labelStyle={{ fontWeight: 600, color: '#6b7280', width: 140 }}
            contentStyle={{ color: '#111827' }}
          >
            <Descriptions.Item label="Booking ID">
              <span style={{ color: BRAND_RED, fontWeight: 700 }}>#{bookingToShow.bookingRef}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Event Title">{bookingToShow.eventTitle}</Descriptions.Item>
            <Descriptions.Item label="Quotation ID">
              {bookingToShow.quotationId ? (
                <span style={{ fontWeight: 600 }}>{bookingToShow.quotationId}</span>
              ) : (
                <span style={{ color: '#9ca3af' }}>—</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusTag status={bookingToShow.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Client">{bookingToShow.client.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{bookingToShow.client.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{bookingToShow.client.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Venue">{bookingToShow.venue}</Descriptions.Item>
            <Descriptions.Item label="Start Date">{bookingToShow.startDate}</Descriptions.Item>
            <Descriptions.Item label="End Date">{bookingToShow.endDate}</Descriptions.Item>
            <Descriptions.Item label="Duration">{bookingToShow.durationLabel}</Descriptions.Item>
            <Descriptions.Item label="Guests">{bookingToShow.guestCount ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Revenue">
              <strong>₹{bookingToShow.revenue.toLocaleString('en-IN')}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Deposit Paid">
              ₹{bookingToShow.depositPaid.toLocaleString('en-IN')} / ₹{bookingToShow.depositTotal.toLocaleString('en-IN')}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'deposits',
      label: 'Deposits',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Table
            dataSource={deposits}
            rowKey="id"
            size="middle"
            loading={depositsQuery.isLoading}
            columns={[
              { title: 'Amount', dataIndex: 'amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { title: 'Due Date', dataIndex: 'dueDate' },
              { title: 'Paid Date', dataIndex: 'paidDate', render: (v) => v || '—' },
              { title: 'Method', dataIndex: 'method', render: (v) => v || '—' },
              { title: 'Status', dataIndex: 'status', render: (s) => <DepositStatusTag status={s} /> },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: unknown, record: any) => (
                  <Space size={8}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditDeposit(record)}>
                      Edit
                    </Button>
                    {record.status !== 'PAID' && (
                      <Button size="small" type="link" onClick={() => handleMarkDepositPaid(record)}>
                        Mark Paid
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
            pagination={false}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginTop: 16, background: BRAND_RED, border: 'none', borderRadius: 8 }}
            onClick={openAddDeposit}
          >
            Add Deposit Entry
          </Button>
        </div>
      ),
    },
    {
      key: 'change-orders',
      label: 'Change Orders',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Table
            dataSource={changeOrders}
            rowKey="id"
            size="middle"
            loading={changeOrdersQuery.isLoading}
            columns={[
              { title: 'Title', dataIndex: 'title', render: (v) => <strong>{v}</strong> },
              { title: 'Description', dataIndex: 'description' },
              {
                title: 'Amount Delta',
                dataIndex: 'amountDelta',
                render: (v) => (
                  <span style={{ color: v >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    {v >= 0 ? '+' : ''}${Number(v).toLocaleString('en-IN')}
                  </span>
                ),
              },
              { title: 'Requested By', dataIndex: 'requestedBy' },
              { title: 'Status', dataIndex: 'status', render: (s) => <ChangeOrderStatusTag status={s} /> },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: unknown, record: any) => (
                  <Space size={8}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditChangeOrder(record)}>
                      Edit
                    </Button>
                    {record.status === 'PENDING' && (
                      <>
                        <Button size="small" type="link" style={{ color: '#16a34a' }} onClick={() => handleQuickChangeOrderStatus(record, 'APPROVED')}>
                          Approve
                        </Button>
                        <Button size="small" type="link" danger onClick={() => handleQuickChangeOrderStatus(record, 'REJECTED')}>
                          Reject
                        </Button>
                      </>
                    )}
                  </Space>
                ),
              },
            ]}
            pagination={false}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginTop: 16, background: BRAND_RED, border: 'none', borderRadius: 8 }}
            onClick={openAddChangeOrder}
          >
            New Change Order
          </Button>
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Timeline
            items={timelineItems.map((t) => ({
              color: t.status === 'CONFIRMED' ? 'green' : t.status === 'PENDING' ? 'orange' : 'blue',
              children: (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.action}</div>
                  <div style={{ color: '#6b7280', fontSize: 12.5 }}>{t.description}</div>
                  <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                    {t.performedBy} · {new Date(t.timestamp).toLocaleString()}
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <div style={{ padding: '20px 0' }}>
          {/* ── Generated Documents ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, color: '#111827' }}>
            Generated Documents
          </div>
          <div style={{ marginBottom: 20, color: '#9ca3af', fontSize: 12 }}>
            Ready-to-send PDFs, generated live from this booking's current details.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              {
                label: 'Confirmation Letter',
                type: 'confirmation' as const,
                prefix: 'confirmation-letter',
                desc: 'Client-facing booking confirmation',
                gradient: 'linear-gradient(135deg, #fdf7f5 0%, #fdece7 100%)',
                iconColor: BRAND_RED,
              },
              {
                label: 'Work Order',
                type: 'work-order' as const,
                prefix: 'work-order',
                desc: 'Internal ops & logistics sheet',
                gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                iconColor: '#1e40af',
              },
              {
                label: 'Event Brief',
                type: 'event-brief' as const,
                prefix: 'event-brief',
                desc: 'One-page event summary',
                gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                iconColor: '#15803d',
              },
            ].map((doc) => (
              <div
                key={doc.type}
                style={{
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 14,
                  padding: '18px 20px',
                  background: doc.gradient,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: doc.iconColor,
                      fontSize: 19,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      flexShrink: 0,
                    }}
                  >
                    <FilePdfOutlined />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{doc.label}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{doc.desc}</div>
                  </div>
                </div>
                <Button
                  icon={<DownloadOutlined />}
                  size="small"
                  block
                  loading={generatingDoc === doc.type}
                  style={{ borderRadius: 8, fontWeight: 600, border: `1px solid ${doc.iconColor}33`, color: doc.iconColor, background: '#fff' }}
                  onClick={() => handleDownloadGenerated(doc.type, doc.prefix)}
                >
                  Download PDF
                </Button>
              </div>
            ))}
          </div>

          {/* ── Uploaded Files ───────────────────────────────────────────────── */}
          <div style={{ marginTop: 32, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Uploaded Files</div>
              <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                Contracts, signed quotations, floor plans, or any other supporting files.
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploadDocumentMutation.status === 'pending'}
              style={{ background: BRAND_RED, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600 }}
            >
              Upload File
            </Button>
          </div>

          <div
            style={{
              border: '1.5px dashed #e5e7eb',
              borderRadius: 12,
              minHeight: 90,
              background: '#fafafa',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUploadFiles(e.dataTransfer.files);
            }}
          >
            {documentsQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                <Spin size="small" />
              </div>
            ) : !documentsQuery.data?.data || documentsQuery.data.data.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <InboxOutlined style={{ fontSize: 24, marginBottom: 6 }} />
                <div style={{ fontSize: 12.5 }}>Drag & drop files here, or click "Upload File"</div>
              </div>
            ) : (
              <div>
                {documentsQuery.data.data.map((doc, idx) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: idx < documentsQuery.data!.data.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: BRAND_RED,
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {getFileIcon(doc.mimeType, doc.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 320,
                          }}
                          title={doc.name}
                        >
                          {doc.name}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 1 }}>
                          {formatFileSize(doc.size)} · {doc.uploadedBy} · {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            key: 'download',
                            icon: <DownloadOutlined />,
                            label: 'Download',
                            onClick: () => handleDownloadUploaded(doc.id, doc.name),
                          },
                          {
                            key: 'delete',
                            icon: <DeleteOutlined />,
                            label: 'Delete',
                            danger: true,
                            onClick: () => handleDeleteUploaded(doc.id, doc.name),
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
                          fontSize: 16,
                        }}
                      >
                        <MoreOutlined />
                      </button>
                    </Dropdown>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <Button
              icon={<SendOutlined />}
              type="primary"
              style={{ background: BRAND_RED, border: 'none', borderRadius: 8 }}
              onClick={() => navigate('/bkg/documents')}
            >
              Submit Handoff
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'audit',
      label: 'Audit Logs',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Table
            dataSource={timelineItems}
            rowKey={(record: any) => record.id ?? `${record.action}-${record.timestamp}`}
            size="small"
            loading={timelineLoading}
            columns={[
              { title: 'Action', dataIndex: 'action', render: (v) => <Tag color="blue">{v}</Tag> },
              { title: 'Description', dataIndex: 'description' },
              { title: 'Performed By', dataIndex: 'performedBy' },
              {
                title: 'Timestamp',
                dataIndex: 'timestamp',
                render: (v) => new Date(v).toLocaleString(),
              },
            ]}
            pagination={false}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Page Header */}
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
            onClick={() => navigate('/bkg/bookings')}
            style={{ borderRadius: 8, border: '1.5px solid #e5e7eb', color: '#374151' }}
          >
            Back
          </Button>
          <Breadcrumb
            items={[
              { title: 'Admin' },
              { title: <span style={{ color: BRAND_RED, cursor: 'pointer' }} onClick={() => navigate('/bkg/bookings')}>Master Register</span> },
              { title: `#${bookingToShow.bookingRef}` },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ClientAvatar
              initials={bookingToShow.client.avatarInitials}
              color={bookingToShow.client.avatarColor}
              name={bookingToShow.client.name}
              size={44}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
                {bookingToShow.eventTitle}
              </div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                {bookingToShow.venue} · {bookingToShow.startDate} – {bookingToShow.endDate}
              </div>
            </div>
            <StatusTag status={bookingToShow.status} />
          </div>
          <Space>
            {['PENDING', 'DRAFT', 'TENTATIVE', 'PAYMENT_PENDING'].includes(bookingToShow.status) && (
              <Button
              type="primary"
              icon={<CheckOutlined />}
              style={{ background: '#16a34a', border: 'none', borderRadius: 8 }}
              loading={confirmMutation.status === 'pending'}
              onClick={() =>
                handleAction(() => confirmMutation.mutateAsync(bookingToShow.id), 'Booking confirmed successfully')
              }
            >
              Confirm
            </Button>
            )}
            {bookingToShow.status === 'CONFIRMED' && (
              <Button
                type="primary"
                loading={startMutation.status === 'pending'}
                onClick={() =>
                  handleAction(() => startMutation.mutateAsync(bookingToShow.id), 'Booking started')
                }
                icon={<PlayCircleOutlined />}
                style={{ background: BRAND_RED, border: 'none', borderRadius: 8 }}
              >
                Start Event
              </Button>
            )}
            <Button 
            icon={<PauseCircleOutlined />} 
            loading={holdMutation.status === 'pending'}
            onClick={() =>
              handleAction(() =>
                holdMutation.mutateAsync({
                  id: bookingToShow.id,
                  data: {
                    reason: 'Manual hold requested',
                    heldBy: 'Operations',
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                  },
                }),
                'Booking moved to hold'
              )
            }
            style={{ borderRadius: 8 }}>
              Hold
            </Button>
            <Popconfirm title="Cancel this booking?" 
            okText="Yes, Cancel" 
            onConfirm={() =>
                handleAction(() => cancelMutation.mutateAsync({
                  id: bookingToShow.id,
                data: {
                  reason: 'Cancelled in app',
                  confirmedBy: 'System',
                  notes: 'Cancelled via dashboard',
                },
              }), 'Booking cancelled')
            }
            okButtonProps={{ danger: true }}>
              <Button danger icon={<CloseOutlined />} style={{ borderRadius: 8 }} loading={cancelMutation.status === 'pending'}>
                Cancel
              </Button>
            </Popconfirm>
            <Button
              icon={<DownloadOutlined />}
              style={{ borderRadius: 8 }}
              onClick={handleDownloadClientPdf}
            >
              Client PDF
            </Button>
            <Button 
            icon={<EditOutlined />} 
            style={{ borderRadius: 8 }}
            onClick={handleEdit}
            >
              Edit
            </Button>
          </Space>
        </div>
      </div>

      {/* Tabs Content */}
      <div style={{ padding: '0 28px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            padding: '0 24px',
            marginTop: 20,
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            tabBarStyle={{ marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Deposit Add/Edit Drawer */}
      <Drawer
        title={editingDeposit ? 'Edit Deposit Entry' : 'Add Deposit Entry'}
        open={depositDrawerOpen}
        onClose={() => {
          setDepositDrawerOpen(false);
          setEditingDeposit(null);
        }}
        width={420}
      >
        <Form form={depositForm} layout="vertical" onFinish={handleDepositSubmit}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Amount is required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true, message: 'Due date is required' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paidDate" label="Paid Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="PENDING">
            <Select
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'PAID', label: 'Paid' },
                { value: 'OVERDUE', label: 'Overdue' },
              ]}
            />
          </Form.Item>
          <Form.Item name="method" label="Payment Method">
            <Select
              allowClear
              options={[
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Credit Card', label: 'Credit Card' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Cheque', label: 'Cheque' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reference" label="Reference / Transaction ID">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={createDepositMutation.isPending || updateDepositMutation.isPending}
            style={{ background: BRAND_RED, border: 'none', borderRadius: 8 }}
          >
            {editingDeposit ? 'Save Changes' : 'Add Deposit'}
          </Button>
        </Form>
      </Drawer>

      {/* Change Order Add/Edit Drawer */}
      <Drawer
        title={editingChangeOrder ? 'Edit Change Order' : 'New Change Order'}
        open={changeOrderDrawerOpen}
        onClose={() => {
          setChangeOrderDrawerOpen(false);
          setEditingChangeOrder(null);
        }}
        width={420}
      >
        <Form form={changeOrderForm} layout="vertical" onFinish={handleChangeOrderSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g. Additional catering" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="amountDelta" label="Amount Delta" rules={[{ required: true, message: 'Amount is required' }]}>
            <InputNumber style={{ width: '100%' }} prefix="$" />
          </Form.Item>
          <Form.Item name="requestedBy" label="Requested By" rules={[{ required: true, message: 'Requested by is required' }]}>
            <Input placeholder="e.g. Client / Sales Rep" />
          </Form.Item>
          {editingChangeOrder && (
            <Form.Item name="status" label="Status">
              <Select
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
            htmlType="submit"
            block
            loading={createChangeOrderMutation.isPending || updateChangeOrderMutation.isPending}
            style={{ background: BRAND_RED, border: 'none', borderRadius: 8 }}
          >
            {editingChangeOrder ? 'Save Changes' : 'Submit Change Order'}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default BookingDetailsScreen;
