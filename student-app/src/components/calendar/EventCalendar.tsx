import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, formatISO, isSameDay } from 'date-fns';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, radius } from '@theme';
import { CalendarEvent } from '@/types';
import { eventTypeMeta } from '@data/mock/calendarEvents';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const dotColorMap: Record<string, string> = {
  rose: colors.accentRose,
  indigo: colors.accentIndigo,
  violet: colors.accentViolet,
  emerald: colors.accentEmerald,
  sky: colors.accentSky,
  amber: colors.accentAmber,
  slate: colors.textTertiary,
};

interface EventCalendarProps {
  monthDate: Date;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function EventCalendar({ monthDate, events, selectedDate, onSelectDate }: EventCalendarProps) {
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const key = e.date;
      map.set(key, [...(map.get(key) ?? []), e]);
    });
    return map;
  }, [events]);

  const { leadingBlanks, monthDays } = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return { leadingBlanks: getDay(start), monthDays: eachDayOfInterval({ start, end }) };
  }, [monthDate]);

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <AppText variant="tiny" color={colors.textTertiary}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {monthDays.map((date) => {
          const iso = formatISO(date, { representation: 'date' });
          const dayEvents = eventsByDate.get(iso) ?? [];
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, new Date());
          return (
            <View key={iso} style={styles.cell}>
              <AnimatedPressable
                onPress={() => onSelectDate(date)}
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: colors.primary },
                  !isSelected && isToday && styles.todayRing,
                ]}
              >
                <AppText variant="caption" color={isSelected ? colors.textInverse : colors.textPrimary}>
                  {format(date, 'd')}
                </AppText>
                {dayEvents.length > 0 && (
                  <View style={styles.dotsRow}>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <View
                        key={e.id}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected
                              ? colors.textInverse
                              : dotColorMap[eventTypeMeta[e.type].color] ?? colors.primary,
                          },
                          idx > 0 && { marginLeft: 2 },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </AnimatedPressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: { borderWidth: 1.5, borderColor: colors.primary },
  dotsRow: { flexDirection: 'row', position: 'absolute', bottom: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
