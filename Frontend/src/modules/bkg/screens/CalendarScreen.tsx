import React, { useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Calendar, Badge, Spin, Empty, Tag } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarApi, ReportApi } from '../services';

const CalendarScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(dayjs());

  const month = String(visibleMonth.month() + 1).padStart(2, '0');
  const year = String(visibleMonth.year());

  // Live: refetch whenever the visible month changes, poll for updates, and
  // stay in sync with the 'calendar.updated' socket event handled globally
  // in useBkgSocket (which invalidates the ['calendar'] query key).
  const { data: eventsRes, isLoading, isFetching } = useQuery({
    queryKey: ['calendar', 'events', year, month],
    queryFn: () => CalendarApi.getEvents({ month, year }),
    refetchInterval: 30000,
  });

  const { data: utilisationRes } = useQuery({
    queryKey: ['reports', 'calendar-utilisation', year, month],
    queryFn: () => ReportApi.getCalendarUtilisation({ month, year }),
    refetchInterval: 30000,
  });

  const events = (eventsRes?.data || []) as Array<{
    id: string;
    title: string;
    start: string;
    status?: string;
  }>;

  const utilisation = (utilisationRes?.data || []) as Array<{
    venue: string;
    utilisationPercent: number;
    bookedDays: number;
    totalDays: number;
  }>;

  const getListData = (value: Dayjs) => {
    const dateStr = value.toDate().toISOString().split('T')[0];
    const items = events.filter((e) => e.start && e.start.startsWith(dateStr));
    return items.map((it) => ({
      type:
        it.status === 'CONFIRMED'
          ? 'success'
          : it.status === 'CANCELLED'
            ? 'error'
            : 'warning',
      content: it.title,
    }));
  };

  const dateCellRender = (value: Dayjs) => {
    const items = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={i}>
            <Badge
              status={
                item.type as 'success' | 'warning' | 'default' | 'error'
              }
              text={item.content}
              style={{ fontSize: 11 }}
            />
          </li>
        ))}
      </ul>
    );
  };

  const handlePanelChange = (value: Dayjs) => {
    setVisibleMonth(value);
    // Warm the cache for the newly selected month right away.
    queryClient.prefetchQuery({
      queryKey: ['calendar', 'events', String(value.year()), String(value.month() + 1).padStart(2, '0')],
      queryFn: () =>
        CalendarApi.getEvents({
          month: String(value.month() + 1).padStart(2, '0'),
          year: String(value.year()),
        }),
    });
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>
            Booking Calendar
          </div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Visual overview of all scheduled events and venue availability — {visibleMonth.format('MMMM YYYY')}.
          </div>
        </div>
        {isFetching && <Spin size="small" />}
      </div>

      {utilisation.length > 0 && (
        <div style={{ padding: '20px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {utilisation.map((u) => (
            <Tag
              key={u.venue}
              color={u.utilisationPercent >= 70 ? 'green' : u.utilisationPercent >= 40 ? 'gold' : 'default'}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12.5 }}
            >
              {u.venue}: {u.utilisationPercent}% booked ({u.bookedDays}/{u.totalDays} days)
            </Tag>
          ))}
        </div>
      )}

      <div style={{ padding: 28 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : !events || events.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #f0f0f0',
              padding: 24,
            }}
          >
            <Calendar
              cellRender={dateCellRender}
              value={visibleMonth}
              onPanelChange={handlePanelChange}
              onSelect={(value, info) => {
                if (info.source === 'date') return;
                setVisibleMonth(value);
              }}
            />
            <Empty description="No events scheduled this month" style={{ marginTop: 16 }} />
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #f0f0f0',
              padding: 24,
            }}
          >
            <Calendar
              cellRender={dateCellRender}
              value={visibleMonth}
              onPanelChange={handlePanelChange}
              onSelect={(value, info) => {
                if (info.source === 'date') return;
                setVisibleMonth(value);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarScreen;
