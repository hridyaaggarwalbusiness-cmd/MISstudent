import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  subMonths,
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  areIntervalsOverlapping,
} from 'date-fns';
import {
  AppText,
  Card,
  Chip,
  IconButton,
  DetailHeader,
  SkeletonCard,
  EmptyState,
} from '@components/ui';
import { EventCalendar } from '@components/calendar/EventCalendar';
import { CalendarEventCard } from '@components/calendar/CalendarEventCard';
import { colors, spacing, layout, radius } from '@theme';
import { repo } from '@data/repositories';
import { CalendarEvent, CalendarEventType } from '@/types';

function eventsOnDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => {
    const start = new Date(e.date);
    const end = e.endDate ? new Date(e.endDate) : start;
    if (Number.isNaN(start.getTime())) return false;
    const safeEnd = Number.isNaN(end.getTime()) || end < start ? start : end;
    return date >= start && date <= safeEnd;
  });
}

type FilterKey = 'all' | CalendarEventType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'holiday', label: 'Holidays' },
  { key: 'exam', label: 'Exams' },
  { key: 'function', label: 'Functions' },
  { key: 'sports', label: 'Sports' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'competition', label: 'Competitions' },
];

export function AcademicCalendarScreen() {
  const [data, setData] = useState<CalendarEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modalDate, setModalDate] = useState<Date | null>(null);

  // Live subscription (not a one-shot fetch) so events an admin adds, edits
  // or removes show up on the calendar immediately, same as Homework/Notices.
  useEffect(() => {
    const unsub = repo.calendar.subscribeAll((items) => {
      setData(items);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  // Data is always live via the subscription above, so "refresh" is just a
  // brief visual acknowledgement of the pull gesture rather than a refetch.
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data : data.filter((e) => e.type === filter);
  }, [data, filter]);

  // Includes multi-day events that only partially overlap the visible
  // month (e.g. an event that starts on the last day of the prior month).
  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    return filteredEvents.filter((e) => {
      const start = new Date(e.date);
      const end = e.endDate ? new Date(e.endDate) : start;
      if (Number.isNaN(start.getTime())) return false;
      const safeEnd = Number.isNaN(end.getTime()) || end < start ? start : end;
      return areIntervalsOverlapping({ start: monthStart, end: monthEnd }, { start, end: safeEnd }, { inclusive: true });
    });
  }, [filteredEvents, monthDate]);

  const agendaEvents = useMemo(() => {
    const eventRange = (e: (typeof filteredEvents)[number]) => {
      const start = new Date(e.date);
      const end = e.endDate ? new Date(e.endDate) : start;
      return { start, end: Number.isNaN(end.getTime()) || end < start ? start : end };
    };
    const list = selectedDate
      ? filteredEvents.filter((e) => {
          const { start, end } = eventRange(e);
          return selectedDate >= start && selectedDate <= end;
        })
      : filteredEvents.filter((e) => eventRange(e).end >= new Date(new Date().toDateString()));
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, selectedDate]);

  const modalEvents = useMemo(
    () => (modalDate ? eventsOnDate(filteredEvents, modalDate) : []),
    [filteredEvents, modalDate],
  );

  function onDayPress(date: Date) {
    setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
    if (eventsOnDate(filteredEvents, date).length > 0) {
      setModalDate(date);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Academic Calendar" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
              style={{ marginRight: spacing.xs }}
            />
          ))}
        </ScrollView>

        {loading && !data ? (
          <SkeletonCard lines={4} />
        ) : (
          <>
            <Card>
              <View style={styles.monthNav}>
                <IconButton icon="chevron-back" onPress={() => setMonthDate((d) => subMonths(d, 1))} size={34} />
                <AppText variant="h3">{format(monthDate, 'MMMM yyyy')}</AppText>
                <IconButton icon="chevron-forward" onPress={() => setMonthDate((d) => addMonths(d, 1))} size={34} />
              </View>
              <EventCalendar
                monthDate={monthDate}
                events={monthEvents}
                selectedDate={selectedDate}
                onSelectDate={onDayPress}
              />
            </Card>

            <View style={styles.sectionTitle}>
              <AppText variant="h3">
                {selectedDate ? `Events on ${format(selectedDate, 'd MMM yyyy')}` : 'Upcoming Events'}
              </AppText>
            </View>

            {agendaEvents.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title={selectedDate ? 'No events on this day' : 'No upcoming events'}
                compact
              />
            ) : (
              agendaEvents.map((event) => <CalendarEventCard key={event.id} event={event} />)
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!modalDate} transparent animationType="fade" onRequestClose={() => setModalDate(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalDate(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">{modalDate ? format(modalDate, 'EEEE, d MMMM yyyy') : ''}</AppText>
              <IconButton icon="close" size={30} onPress={() => setModalDate(null)} />
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {modalEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} showDescription />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
