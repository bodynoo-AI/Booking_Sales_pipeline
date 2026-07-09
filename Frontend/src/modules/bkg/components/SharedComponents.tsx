import React from 'react';
import { Tag, Avatar, Badge } from 'antd';
import type { BookingStatus, HoldStatus, DepositStatus, ChangeOrderStatus } from '../types';

// ─── Status Tag ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BookingStatus, { color: string; label: string; bg: string; border: string }> = {
  PENDING:      { color: '#92400e', label: 'Pending',         bg: '#fef3c7', border: '#f59e0b' },
  DRAFT:        { color: '#7c2d12', label: 'Draft',           bg: '#ffedd5', border: '#fb923c' },
  TENTATIVE:    { color: '#7c3aed', label: 'Tentative',       bg: '#f5f3ff', border: '#a78bfa' },
  PAYMENT_PENDING: { color: '#b45309', label: 'Payment Pending', bg: '#fef3c7', border: '#f59e0b' },
  CONFIRMED:    { color: '#065f46', label: 'Confirmed',       bg: '#d1fae5', border: '#10b981' },
  IN_PROGRESS:  { color: '#be123c', label: 'In-Progress',     bg: '#ffe4e6', border: '#f43f5e' },
  COMPLETED:    { color: '#1e40af', label: 'Completed',       bg: '#dbeafe', border: '#3b82f6' },
  CANCELLED:    { color: '#374151', label: 'Cancelled',       bg: '#f3f4f6', border: '#9ca3af' },
  ON_HOLD:      { color: '#4c1d95', label: 'On Hold',         bg: '#ede9fe', border: '#8b5cf6' },
};

export const getBookingStatusConfig = (status: BookingStatus) => STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

interface StatusTagProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'md' }) => {
  const cfg = getBookingStatusConfig(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '3px 12px',
        borderRadius: 20,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.color,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
};

// ─── Hold Status Tag ──────────────────────────────────────────────────────────
const HOLD_STATUS_CONFIG: Record<HoldStatus, { color: string }> = {
  ACTIVE:    { color: 'orange' },
  EXPIRED:   { color: 'red' },
  RELEASED:  { color: 'default' },
  CONVERTED: { color: 'green' },
};

export const HoldStatusTag: React.FC<{ status: HoldStatus }> = ({ status }) => (
  <Tag color={HOLD_STATUS_CONFIG[status].color}>{status}</Tag>
);

// ─── Deposit Status Tag ───────────────────────────────────────────────────────
const DEPOSIT_STATUS_CONFIG: Record<DepositStatus, { color: string }> = {
  PENDING: { color: 'default' },
  PAID:    { color: 'green' },
  OVERDUE: { color: 'red' },
  WAIVED:  { color: 'blue' },
};

export const DepositStatusTag: React.FC<{ status: DepositStatus }> = ({ status }) => (
  <Tag color={DEPOSIT_STATUS_CONFIG[status].color}>{status}</Tag>
);

// ─── Change Order Status Tag ──────────────────────────────────────────────────
const CO_STATUS_CONFIG: Record<ChangeOrderStatus, { color: string }> = {
  PENDING:  { color: 'orange' },
  APPROVED: { color: 'green' },
  REJECTED: { color: 'red' },
};

export const ChangeOrderStatusTag: React.FC<{ status: ChangeOrderStatus }> = ({ status }) => (
  <Tag color={CO_STATUS_CONFIG[status].color}>{status}</Tag>
);

// ─── Client Avatar ────────────────────────────────────────────────────────────
interface ClientAvatarProps {
  initials: string;
  color?: string;
  name?: string;
  size?: number;
  onClick?: () => void;
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({
  initials,
  color = '#c7361a',
  name,
  size = 36,
  onClick,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: onClick ? 'pointer' : 'default',
    }}
    onClick={onClick}
  >
    <Avatar
      size={size}
      style={{
        background: color,
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
      }}
    >
      {initials}
    </Avatar>
    {name && (
      <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{name}</span>
    )}
  </div>
);

// ─── Booking Ref ──────────────────────────────────────────────────────────────
export const BookingRef: React.FC<{ ref_: string; onClick?: () => void }> = ({ ref_, onClick }) => (
  <span
    style={{
      color: '#c7361a',
      fontWeight: 700,
      cursor: onClick ? 'pointer' : 'default',
      fontSize: 13,
    }}
    onClick={onClick}
  >
    #{ref_}
  </span>
);

// ─── Revenue Badge ────────────────────────────────────────────────────────────
export const RevenueBadge: React.FC<{ amount: number; size?: 'sm' | 'md' }> = ({
  amount,
  size = 'md',
}) => (
  <span
    style={{
      fontWeight: 700,
      fontSize: size === 'sm' ? 13 : 15,
      color: '#111827',
      letterSpacing: '-0.01em',
    }}
  >
    {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
);

// ─── Alert Badge ──────────────────────────────────────────────────────────────
export const AlertBadge: React.FC<{ count: number }> = ({ count }) => (
  <Badge count={count} size="small" style={{ background: '#c7361a' }} />
);

// ─── Section Card ─────────────────────────────────────────────────────────────
export const SectionCard: React.FC<{
  title?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, extra, children, style }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #f1f1f1',
      overflow: 'hidden',
      ...style,
    }}
  >
    {(title || extra) && (
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {title && (
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{title}</span>
        )}
        {extra}
      </div>
    )}
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);
