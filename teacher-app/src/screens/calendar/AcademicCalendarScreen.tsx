import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, subMonths, format, isSameDay, isSameMonth } from 'date-fns';
import {
  AppText,
  Card,
  Chip,
  IconButton,
  DetailHeader,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { EventCalendar } from '@components/calendar/EventCalendar';
import { CalendarEventCard } from '@components/calendar/CalendarEventCard';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { CalendarEventType } from '@/types';

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
  const { data, loading, refreshing, error, refresh } = useAsyncResource(() => repo.calendar.list(), []);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data : data.filter((e) => e.type === filter);
  }, [data, filter]);

  const monthEvents = useMemo(
    () => filteredEvents.filter((e) => isSameMonth(new Date(e.date), monthDate)),
    [filteredEvents, monthDate],
  );

  const agendaEvents = useMemo(() => {
    const list = selectedDate
      ? filteredEvents.filter((e) => isSameDay(new Date(e.date), selectedDate))
      : filteredEvents.filter((e) => new Date(e.date) >= new Date(new Date().toDateString()));
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, selectedDate]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Academic Calendar" />

      {error && !data ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          <View style={{ position: 'relative', marginBottom: spacing.md }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          </View>

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
                  onSelectDate={(d) => setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d))}
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
