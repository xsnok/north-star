import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import {
  LIQUID_GLASS_NAVBAR_RESERVED_HEIGHT,
  LiquidGlassNavbar,
} from '@/components/liquid-glass-navbar';
import { type DailyCheckIn, loadDailyCheckIns } from '@/lib/daily-checkins';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date: Date) {
  const startOfWeek = new Date(date);
  const mondayOffset = (startOfWeek.getDay() + 6) % 7;

  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

  return startOfWeek;
}

function getCheckInDateKeys(checkIns: DailyCheckIn[]) {
  return new Set(
    checkIns
      .map((checkIn) => new Date(checkIn.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(getLocalDateKey)
  );
}

function getCurrentStreak(checkInDateKeys: Set<string>) {
  let streak = 0;
  const cursor = new Date();

  cursor.setHours(0, 0, 0, 0);

  while (checkInDateKeys.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatCheckInDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Saved check-in';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

function getPreviewText(checkIn: DailyCheckIn) {
  const preview = checkIn.goalsText.trim() || checkIn.actionPlanText.trim();

  if (!preview) {
    return 'No written reflection yet.';
  }

  return preview.length > 116 ? `${preview.slice(0, 113).trim()}...` : preview;
}

function WeeklyStreak({ checkIns }: { checkIns: DailyCheckIn[] }) {
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const startOfWeek = getStartOfWeek(today);
  const checkInDateKeys = getCheckInDateKeys(checkIns);
  const weekDays = WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(startOfWeek.getTime() + index * DAY_IN_MS);
    const dateKey = getLocalDateKey(date);

    return {
      date,
      dateKey,
      isComplete: checkInDateKeys.has(dateKey),
      isToday: dateKey === todayKey,
      label,
    };
  });

  return (
    <View accessibilityRole="summary" style={styles.streakCard}>
      <View style={styles.streakWeekRow}>
        {weekDays.map((day) => (
          <View key={day.dateKey} style={styles.streakDayColumn}>
            <Text style={styles.streakDayLabel}>{day.label}</Text>
            <View
              style={[
                styles.streakDateMarker,
                day.isComplete && styles.streakDateComplete,
                day.isToday && styles.streakDateToday,
              ]}>
              {day.isComplete ? (
                <Ionicons color={day.isToday ? '#FFFFFF' : '#111111'} name="checkmark" size={16} />
              ) : (
                <Text style={[styles.streakDateText, day.isToday && styles.streakDateTodayText]}>
                  {day.date.getDate()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function HomeTopBar({ checkIns }: { checkIns: DailyCheckIn[] }) {
  const currentStreak = getCurrentStreak(getCheckInDateKeys(checkIns));

  return (
    <View style={styles.topBar}>
      <View
        accessibilityLabel={`${currentStreak} day${currentStreak === 1 ? '' : 's'} streak`}
        style={styles.topStreak}>
        <Ionicons color="#111111" name="flame" size={18} />
        <Text style={styles.topStreakText}>{currentStreak}</Text>
      </View>

      <Text style={styles.topTitle}>home</Text>

      <Pressable accessibilityLabel="Profile" accessibilityRole="button" style={styles.profileButton}>
        <Ionicons color="#111111" name="person" size={18} />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  const refreshCheckIns = useCallback(() => {
    let isActive = true;

    setIsLoading(true);
    loadDailyCheckIns()
      .then((nextCheckIns) => {
        if (isActive) {
          setCheckIns(nextCheckIns);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useFocusEffect(refreshCheckIns);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(
              insets.bottom + LIQUID_GLASS_NAVBAR_RESERVED_HEIGHT,
              LIQUID_GLASS_NAVBAR_RESERVED_HEIGHT + 24
            ),
            paddingTop: Math.max(insets.top - (isCompact ? 6 : 2), 16),
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <HomeTopBar checkIns={checkIns} />
        <WeeklyStreak checkIns={checkIns} />

        <View style={styles.header}>
          <View style={styles.mark}>
            <Text style={styles.markText}>N.</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, isCompact && styles.eyebrowCompact]}>
              Today
            </Text>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              Set your North Star.
            </Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
              Check in, choose your focus, and turn today’s goals into a clear plan.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/daily-check-in')}
          style={({ pressed }) => [
            styles.checkInButton,
            isCompact && styles.checkInButtonCompact,
            pressed && styles.checkInButtonPressed,
          ]}>
          <View style={styles.checkInIcon}>
            <Ionicons color="#FFFFFF" name="compass-outline" size={26} />
          </View>
          <View style={styles.checkInCopy}>
            <Text style={styles.checkInTitle}>Daily Check-In</Text>
            <Text style={styles.checkInSubtitle}>Start a focused plan for today</Text>
          </View>
          <Ionicons color="#FFFFFF" name="arrow-forward" size={24} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent check-ins</Text>
          <Text style={styles.sectionMeta}>
            {checkIns.length ? `${checkIns.length} saved` : 'Local only'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#111111" />
          </View>
        ) : checkIns.length ? (
          <View style={styles.historyList}>
            {checkIns.map((checkIn) => (
              <View key={checkIn.id} style={styles.historyCard}>
                <View style={styles.historyTopLine}>
                  <Text style={styles.historyDate}>{formatCheckInDate(checkIn.createdAt)}</Text>
                  <View style={styles.restedBadge}>
                    <Ionicons color="#111111" name="battery-charging-outline" size={16} />
                    <Text style={styles.restedBadgeText}>{checkIn.restedScore}/10</Text>
                  </View>
                </View>

                <View style={styles.focusRow}>
                  {checkIn.focuses.map((focus) => (
                    <View key={focus} style={styles.focusPill}>
                      <Text style={styles.focusPillText}>{focus}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.historyPreview}>{getPreviewText(checkIn)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptyCopy}>
              Your saved daily reflections will appear here after you complete one.
            </Text>
          </View>
        )}
      </ScrollView>
      <LiquidGlassNavbar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FCFCF8',
    flex: 1,
  },
  content: {
    gap: 24,
    paddingHorizontal: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    position: 'relative',
  },
  topStreak: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    left: 0,
    minHeight: 36,
    paddingHorizontal: 2,
    position: 'absolute',
  },
  topStreakText: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 20,
  },
  topTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 23,
    textAlign: 'center',
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#F1F1EA',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 36,
  },
  streakCard: {
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: 2,
  },
  streakWeekRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  streakDayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  streakDayLabel: {
    color: '#77776F',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 15,
  },
  streakDateMarker: {
    alignItems: 'center',
    backgroundColor: '#F5F5EF',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  streakDateComplete: {
    backgroundColor: '#E8E8E0',
    borderColor: '#DADAD2',
  },
  streakDateToday: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  streakDateText: {
    color: '#5F5F58',
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 18,
  },
  streakDateTodayText: {
    color: '#FFFFFF',
  },
  header: {
    gap: 18,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  markText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerCopy: {
    gap: 10,
  },
  eyebrow: {
    color: '#777777',
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  eyebrowCompact: {
    fontSize: 14,
  },
  title: {
    color: '#101010',
    fontFamily: Fonts.rounded,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 42,
  },
  titleCompact: {
    fontSize: 31,
    lineHeight: 37,
  },
  subtitle: {
    color: '#747474',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
    maxWidth: 440,
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 23,
  },
  checkInButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 28,
    flexDirection: 'row',
    gap: 14,
    minHeight: 96,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  checkInButtonCompact: {
    borderRadius: 24,
    minHeight: 86,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  checkInButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  checkInIcon: {
    alignItems: 'center',
    backgroundColor: '#313131',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  checkInCopy: {
    flex: 1,
    gap: 4,
  },
  checkInTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  checkInSubtitle: {
    color: '#CFCFCF',
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionMeta: {
    color: '#858585',
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECECE4',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  historyTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDate: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  restedBadge: {
    alignItems: 'center',
    backgroundColor: '#F1F1EA',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  restedBadgeText: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  focusPill: {
    backgroundColor: '#F5F5EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  focusPillText: {
    color: '#3A3A34',
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  historyPreview: {
    color: '#696960',
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EEEEEA',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    minHeight: 150,
    justifyContent: 'center',
    padding: 22,
  },
  emptyTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  emptyCopy: {
    color: '#797971',
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
    maxWidth: 280,
    textAlign: 'center',
  },
});
