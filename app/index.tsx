import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';

const REASONS = [
  'Elevate mood',
  'Reduce stress & anxiety',
  'Improve sleep',
  'Increase productivity',
  'Something else',
];

const AGE_RANGES = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'Over 64'];

type Reminder = {
  enabled: boolean;
  hour: number;
  id: 'morning' | 'day' | 'evening';
  label: string;
  minute: number;
  notificationId: string | null;
};

const DEFAULT_REMINDERS: Reminder[] = [
  { enabled: true, hour: 8, id: 'morning', label: 'Morning', minute: 0, notificationId: null },
  { enabled: true, hour: 14, id: 'day', label: 'During the Day', minute: 30, notificationId: null },
  { enabled: true, hour: 21, id: 'evening', label: 'Evening', minute: 0, notificationId: null },
];

const NOTIFICATION_CHANNEL_ID = 'daily-journal-reminders';
const REMINDER_NOTIFICATION_BODY = 'Hey, what are you grateful for today?';

const REASON_FACTS: Record<string, string> = {
  'Elevate mood':
    'A few minutes of reflection can help you notice what lifted your day and make those moments easier to repeat.',
  'Reduce stress & anxiety':
    'Naming what you feel can lower mental load and make anxious thoughts feel more manageable.',
  'Improve sleep':
    'Writing down worries before bed can help your mind set them aside instead of replaying them.',
  'Increase productivity':
    'A quick journal check-in can turn scattered thoughts into a clearer next step.',
  'Something else':
    'Journaling is flexible enough to meet you where you are, even when your reason changes day to day.',
};

const OPTION_ANIMATION = {
  duration: 240,
  easing: Easing.out(Easing.cubic),
};

const AnimatedText = Animated.createAnimatedComponent(Text);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ReasonOptionProps = {
  fact: string;
  isCompact: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isVeryCompact: boolean;
  onPress: () => void;
  reason: string;
};

type AgeOptionProps = {
  ageRange: string;
  isCompact: boolean;
  isSelected: boolean;
  isVeryCompact: boolean;
  onPress: () => void;
};

type ReminderOptionProps = {
  enabled: boolean;
  isCompact: boolean;
  isVeryCompact: boolean;
  label: string;
  onPressTime: () => void;
  onToggle: () => void;
  time: string;
};

function formatReminderTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = String(minute).padStart(2, '0');

  return `${displayHour}:${displayMinute} ${suffix}`;
}

function getDateFromReminder(reminder: Reminder) {
  const date = new Date();
  date.setHours(reminder.hour, reminder.minute, 0, 0);

  return date;
}

async function configureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'Daily journal reminders',
  });
}

function ReasonOption({
  fact,
  isCompact,
  isExpanded,
  isSelected,
  isVeryCompact,
  onPress,
  reason,
}: ReasonOptionProps) {
  const optionRadius = isVeryCompact ? 22 : isCompact ? 24 : 27;
  const selectedProgress = useDerivedValue(() =>
    withTiming(isSelected ? 1 : 0, OPTION_ANIMATION)
  );

  const optionAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      ['#FFFFFF', '#000000']
    ),
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.88)', '#000000']
    ),
    borderRadius: optionRadius,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.value, [0, 1], ['#151515', '#FFFFFF']),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionTouchTarget,
        pressed && styles.optionPressed,
      ]}>
      <Animated.View
        layout={LinearTransition.duration(OPTION_ANIMATION.duration).easing(OPTION_ANIMATION.easing)}
        style={[
          styles.option,
          isCompact && styles.optionCompact,
          isVeryCompact && styles.optionVeryCompact,
          isExpanded && styles.optionExpanded,
          optionAnimatedStyle,
        ]}>
        <AnimatedText
          style={[
            styles.optionText,
            isVeryCompact && styles.optionTextCompact,
            textAnimatedStyle,
          ]}>
          {reason}
        </AnimatedText>
        {isExpanded ? (
          <AnimatedText
            entering={FadeInDown.duration(180).easing(OPTION_ANIMATION.easing)}
            exiting={FadeOutUp.duration(140).easing(OPTION_ANIMATION.easing)}
            style={[styles.factText, isVeryCompact && styles.factTextCompact]}>
            {fact}
          </AnimatedText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function AgeOption({
  ageRange,
  isCompact,
  isSelected,
  isVeryCompact,
  onPress,
}: AgeOptionProps) {
  const optionRadius = isVeryCompact ? 24 : isCompact ? 27 : 32;
  const selectedProgress = useDerivedValue(() =>
    withTiming(isSelected ? 1 : 0, OPTION_ANIMATION)
  );

  const optionAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      ['#FFFFFF', '#000000']
    ),
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.92)', '#000000']
    ),
    borderRadius: optionRadius,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.value, [0, 1], ['#151515', '#FFFFFF']),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ageOptionTouchTarget,
        pressed && styles.optionPressed,
      ]}>
      <Animated.View
        style={[
          styles.ageOption,
          isCompact && styles.ageOptionCompact,
          isVeryCompact && styles.ageOptionVeryCompact,
          optionAnimatedStyle,
        ]}>
        <AnimatedText
          style={[
            styles.ageOptionText,
            isVeryCompact && styles.ageOptionTextCompact,
            textAnimatedStyle,
          ]}>
          {ageRange}
        </AnimatedText>
      </Animated.View>
    </Pressable>
  );
}

function ReminderOption({
  enabled,
  isCompact,
  isVeryCompact,
  label,
  onPressTime,
  onToggle,
  time,
}: ReminderOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPressTime}
      style={({ pressed }) => [
        styles.reminderOption,
        isCompact && styles.reminderOptionCompact,
        isVeryCompact && styles.reminderOptionVeryCompact,
        pressed && styles.optionPressed,
      ]}>
      <View style={styles.reminderCopy}>
        <Text style={[styles.reminderLabel, isVeryCompact && styles.reminderLabelCompact]}>
          {label}
        </Text>
        <View style={styles.reminderTimeRow}>
          <Text style={[styles.reminderTime, isVeryCompact && styles.reminderTimeCompact]}>
            {time}
          </Text>
          <Text style={[styles.reminderChevron, isVeryCompact && styles.reminderChevronCompact]}>
            ›
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`${enabled ? 'Disable' : 'Enable'} ${label} reminder`}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        hitSlop={10}
        onPress={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        style={({ pressed }) => [
          styles.reminderSwitchTouchTarget,
          pressed && styles.pressed,
        ]}>
        <View
          style={[
            styles.reminderSwitch,
            !enabled && styles.reminderSwitchOff,
            isVeryCompact && styles.reminderSwitchCompact,
          ]}>
          <View
            style={[
              styles.reminderSwitchThumb,
              !enabled && styles.reminderSwitchThumbOff,
              isVeryCompact && styles.reminderSwitchThumbCompact,
            ]}
          />
        </View>
      </Pressable>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<'reasons' | 'age' | 'reminders'>('reasons');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [activeReminderId, setActiveReminderId] = useState<Reminder['id'] | null>(null);
  const [draftReminderTime, setDraftReminderTime] = useState<Date | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const isVeryCompact = height < 700;
  const isAgeStep = step === 'age';
  const isReminderStep = step === 'reminders';
  const activeReminder = reminders.find((reminder) => reminder.id === activeReminderId) ?? null;
  const enabledReminderCount = reminders.filter((reminder) => reminder.enabled).length;
  const continueButtonHeight = isVeryCompact ? 52 : isCompact ? 56 : 62;
  const footerGap = isReminderStep ? 0 : isCompact ? 12 : 16;
  const noteHeight = isReminderStep ? 0 : isAgeStep ? (isCompact ? 34 : 44) : isCompact ? 40 : 52;
  const footerHeight = noteHeight + footerGap + continueButtonHeight;
  const footerBottomOffset = isCompact
    ? Math.max(insets.bottom + 16, 24)
    : Math.max(insets.bottom + 28, 40);
  const footerReserve = footerHeight + footerBottomOffset + 24;

  const toggleReason = (reason: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    setSelectedReasons((current) => {
      const isAlreadySelected = current.includes(reason);
      const next = isAlreadySelected
        ? current.filter((item) => item !== reason)
        : [...current, reason];

      setExpandedReason((currentExpandedReason) => {
        if (currentExpandedReason && next.includes(currentExpandedReason)) {
          return currentExpandedReason;
        }

        return next[0] ?? null;
      });

      return next;
    });
  };

  const selectAgeRange = (ageRange: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    setSelectedAgeRange(ageRange);
  };

  const showNotificationPermissionAlert = () => {
    Alert.alert(
      'Notifications are off',
      'Turn on notifications in Settings to receive your journal reminders.'
    );
  };

  const ensureNotificationPermission = async () => {
    await configureAndroidNotificationChannel();

    const currentPermission = await Notifications.getPermissionsAsync();
    const finalPermission = currentPermission.granted
      ? currentPermission
      : await Notifications.requestPermissionsAsync();

    if (!finalPermission.granted) {
      showNotificationPermissionAlert();
      return false;
    }

    return true;
  };

  const scheduleReminderNotification = async (reminder: Reminder) => {
    const hasPermission = await ensureNotificationPermission();

    if (!hasPermission) {
      return null;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        body: REMINDER_NOTIFICATION_BODY,
        title: 'North Star',
      },
      trigger: {
        channelId: NOTIFICATION_CHANNEL_ID,
        hour: reminder.hour,
        minute: reminder.minute,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });
  };

  const cancelReminderNotification = async (notificationId: string | null) => {
    if (!notificationId) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  const toggleReminder = async (reminderId: Reminder['id']) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return;
    }

    if (reminder.enabled) {
      await cancelReminderNotification(reminder.notificationId);
      setReminders((current) =>
        current.map((item) =>
          item.id === reminderId ? { ...item, enabled: false, notificationId: null } : item
        )
      );
      return;
    }

    try {
      const notificationId = await scheduleReminderNotification(reminder);

      if (!notificationId) {
        setReminders((current) =>
          current.map((item) =>
            item.id === reminderId ? { ...item, enabled: false, notificationId: null } : item
          )
        );
        return;
      }

      setReminders((current) =>
        current.map((item) =>
          item.id === reminderId ? { ...item, enabled: true, notificationId } : item
        )
      );
    } catch {
      Alert.alert('Reminder not scheduled', 'Try again in a moment.');
    }
  };

  const commitReminderTime = async (reminderId: Reminder['id'], date: Date) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return;
    }

    const nextReminder = {
      ...reminder,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };

    try {
      if (!reminder.enabled) {
        setReminders((current) =>
          current.map((item) => (item.id === reminderId ? nextReminder : item))
        );
        return;
      }

      await cancelReminderNotification(reminder.notificationId);
      const notificationId = await scheduleReminderNotification(nextReminder);

      setReminders((current) =>
        current.map((item) =>
          item.id === reminderId
            ? {
                ...nextReminder,
                enabled: Boolean(notificationId),
                notificationId,
              }
            : item
        )
      );
    } catch {
      setReminders((current) =>
        current.map((item) =>
          item.id === reminderId
            ? { ...nextReminder, enabled: false, notificationId: null }
            : item
        )
      );
      Alert.alert('Reminder not scheduled', 'The time was updated, but the reminder could not be scheduled.');
    }
  };

  const openReminderTimePicker = (reminderId: Reminder['id']) => {
    const reminder = reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      return;
    }

    const pickerValue = getDateFromReminder(reminder);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        display: 'clock',
        is24Hour: false,
        mode: 'time',
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type === 'set' && selectedDate) {
            commitReminderTime(reminderId, selectedDate);
          }
        },
        value: pickerValue,
      });
      return;
    }

    setActiveReminderId(reminderId);
    setDraftReminderTime(pickerValue);
  };

  const closeReminderTimePicker = () => {
    setActiveReminderId(null);
    setDraftReminderTime(null);
  };

  const saveDraftReminderTime = () => {
    if (activeReminderId && draftReminderTime) {
      commitReminderTime(activeReminderId, draftReminderTime);
    }

    closeReminderTimePicker();
  };

  const scheduleEnabledReminders = async () => {
    for (const reminder of reminders) {
      if (reminder.enabled && !reminder.notificationId) {
        const notificationId = await scheduleReminderNotification(reminder);

        setReminders((current) =>
          current.map((item) =>
            item.id === reminder.id
              ? { ...item, enabled: Boolean(notificationId), notificationId }
              : item
          )
        );
      }
    }
  };

  const goBack = () => {
    if (step === 'reminders') {
      setStep('age');
    } else if (step === 'age') {
      setStep('reasons');
    }
  };

  const continueOnboarding = async () => {
    if (step === 'reasons') {
      setStep('age');
    } else if (step === 'age') {
      setStep('reminders');
    } else if (step === 'reminders') {
      await scheduleEnabledReminders();
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View
        style={[
          styles.content,
          {
            paddingBottom: footerReserve,
            paddingTop: Math.max(insets.top + (isCompact ? 8 : 28), isCompact ? 24 : 60),
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={16}
            onPress={goBack}
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>

          {isReminderStep ? (
            <View style={styles.skipButtonPlaceholder} />
          ) : (
            <Pressable
              accessibilityRole="button"
              hitSlop={16}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        <View
          style={[
            styles.main,
            isReminderStep && styles.reminderMain,
            {
              paddingTop: isReminderStep
                ? isVeryCompact
                  ? 2
                  : isCompact
                    ? 10
                    : 20
                : isVeryCompact
                  ? 10
                  : isCompact
                    ? 20
                    : 28,
            },
          ]}>
          {isReminderStep ? (
            <>
              <View style={[styles.reminderHeader, isVeryCompact && styles.reminderHeaderCompact]}>
                <Text style={[styles.reminderTitle, isVeryCompact && styles.reminderTitleCompact]}>
                  When do you want to carve{'\n'}out time for journaling?
                </Text>
                <Text style={[styles.reminderSubtitle, isVeryCompact && styles.reminderSubtitleCompact]}>
                  You’re most likely to form a healthy{'\n'}habit with{'\n'}
                  <Text style={styles.reminderSubtitleStrong}>
                    {enabledReminderCount} daily notification{enabledReminderCount === 1 ? '' : 's'}.
                  </Text>
                </Text>
              </View>

              <View style={[styles.reminderMockSlot, isVeryCompact && styles.reminderMockSlotCompact]}>
                <View
                  style={[
                    styles.reminderMockPhone,
                    isCompact && styles.reminderMockPhoneCompact,
                    isVeryCompact && styles.reminderMockPhoneVeryCompact,
                  ]}>
                  <View
                    style={[
                      styles.notificationPreview,
                      isCompact && styles.notificationPreviewCompact,
                      isVeryCompact && styles.notificationPreviewVeryCompact,
                    ]}>
                    <View style={[styles.notificationIcon, isVeryCompact && styles.notificationIconCompact]}>
                      <Text style={[styles.notificationIconText, isVeryCompact && styles.notificationIconTextCompact]}>
                        N.
                      </Text>
                    </View>
                    <View style={styles.notificationBody}>
                      <View style={styles.notificationTopLine}>
                        <Text style={[styles.notificationAppName, isVeryCompact && styles.notificationTextCompact]}>
                          North Star
                        </Text>
                        <Text style={[styles.notificationNow, isVeryCompact && styles.notificationTextCompact]}>
                          now
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.notificationMessage,
                          isVeryCompact && styles.notificationMessageCompact,
                        ]}>
                        {REMINDER_NOTIFICATION_BODY}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.reminderOptions, isVeryCompact && styles.reminderOptionsCompact]}>
                    {reminders.map((reminder) => (
                      <ReminderOption
                        enabled={reminder.enabled}
                        isCompact={isCompact}
                        isVeryCompact={isVeryCompact}
                        key={reminder.id}
                        label={reminder.label}
                        onPressTime={() => openReminderTimePicker(reminder.id)}
                        onToggle={() => toggleReminder(reminder.id)}
                        time={formatReminderTime(reminder.hour, reminder.minute)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.copy, isAgeStep && styles.ageCopy, isVeryCompact && styles.copyCompact]}>
                <Text style={[styles.title, isVeryCompact && styles.titleCompact]}>
                  {isAgeStep ? 'How old are you?' : 'What’s on your mind?'}
                </Text>
                <Text style={[styles.subtitle, isVeryCompact && styles.subtitleCompact]}>
                  Your answers will help shape the app{'\n'}around your needs.
                </Text>
              </View>

              {isAgeStep ? (
            <View
              style={[
                styles.ageOptionsSlot,
                isCompact && styles.ageOptionsSlotCompactHeight,
                isVeryCompact && styles.ageOptionsSlotCompact,
              ]}>
              <View style={[styles.ageOptions, isCompact && styles.ageOptionsCompact]}>
                {AGE_RANGES.map((ageRange) => (
                  <AgeOption
                    ageRange={ageRange}
                    isCompact={isCompact}
                    isSelected={selectedAgeRange === ageRange}
                    isVeryCompact={isVeryCompact}
                    key={ageRange}
                    onPress={() => selectAgeRange(ageRange)}
                  />
                ))}
              </View>
            </View>
              ) : (
            <View
              style={[
                styles.optionsSlot,
                expandedReason && {
                  justifyContent: 'flex-start',
                  paddingTop: isVeryCompact ? 16 : 24,
                },
              ]}>
              <View style={[styles.options, isCompact && styles.optionsCompact]}>
                {REASONS.map((reason) => {
                  const isSelected = selectedReasons.includes(reason);
                  const isExpanded = expandedReason === reason;

                  return (
                    <ReasonOption
                      fact={REASON_FACTS[reason]}
                      isCompact={isCompact}
                      isExpanded={isExpanded}
                      isSelected={isSelected}
                      isVeryCompact={isVeryCompact}
                      key={reason}
                      onPress={() => toggleReason(reason)}
                      reason={reason}
                    />
                  );
                })}
              </View>
            </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={[styles.footer, { bottom: footerBottomOffset, gap: footerGap }]}>
        {isReminderStep ? null : (
          <Text style={[styles.note, isAgeStep && styles.ageNote, isCompact && styles.noteCompact]}>
            Your selections won’t limit access to{'\n'}any features.
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={continueOnboarding}
          style={({ pressed }) => [
            styles.continueButton,
            isCompact && styles.continueButtonCompact,
            isVeryCompact && styles.continueButtonVeryCompact,
            { height: continueButtonHeight },
            pressed && styles.continuePressed,
          ]}>
          <Text style={[styles.continueText, isCompact && styles.continueTextCompact]}>
            Continue
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={Platform.OS === 'ios' && Boolean(activeReminder)}
        onRequestClose={closeReminderTimePicker}>
        <Pressable style={styles.timePickerBackdrop} onPress={closeReminderTimePicker}>
          <Pressable style={styles.timePickerSheet}>
            <View style={styles.timePickerHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={closeReminderTimePicker}
                style={({ pressed }) => [styles.timePickerAction, pressed && styles.pressed]}>
                <Text style={styles.timePickerCancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.timePickerTitle}>
                {activeReminder ? activeReminder.label : 'Reminder'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={saveDraftReminderTime}
                style={({ pressed }) => [styles.timePickerAction, pressed && styles.pressed]}>
                <Text style={styles.timePickerDoneText}>Done</Text>
              </Pressable>
            </View>
            {draftReminderTime ? (
              <DateTimePicker
                display="spinner"
                mode="time"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    setDraftReminderTime(selectedDate);
                  }
                }}
                value={draftReminderTime}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#FCFCF8',
    flex: 1,
    paddingHorizontal: 32,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 520,
    width: '100%',
  },
  navButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backGlyph: {
    color: '#868686',
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '300',
    lineHeight: 40,
  },
  skipButton: {
    justifyContent: 'center',
    minHeight: 44,
  },
  skipButtonPlaceholder: {
    minHeight: 44,
    width: 40,
  },
  skipText: {
    color: '#7B7B7B',
    fontFamily: Fonts.rounded,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.55,
  },
  main: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 520,
    width: '100%',
  },
  reminderMain: {
    maxWidth: 560,
  },
  copy: {
    alignItems: 'center',
    gap: 16,
  },
  ageCopy: {
    gap: 12,
  },
  copyCompact: {
    gap: 10,
  },
  title: {
    color: '#121212',
    fontFamily: Fonts.rounded,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 32,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  optionsSlot: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  options: {
    gap: 4,
    width: '100%',
  },
  optionsCompact: {
    gap: 4,
  },
  ageOptionsSlot: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 0,
    paddingTop: 16,
    width: '100%',
  },
  ageOptionsSlotCompactHeight: {
    paddingTop: 12,
  },
  ageOptionsSlotCompact: {
    paddingTop: 8,
  },
  reminderHeader: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
    zIndex: 2,
  },
  reminderHeaderCompact: {
    gap: 9,
  },
  reminderTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 32,
    textAlign: 'center',
  },
  reminderTitleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  reminderSubtitle: {
    color: '#898989',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
    textAlign: 'center',
  },
  reminderSubtitleCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  reminderSubtitleStrong: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
  },
  reminderMockSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: -6,
    overflow: 'hidden',
    paddingHorizontal: 2,
    paddingTop: 20,
    width: '100%',
  },
  reminderMockSlotCompact: {
    marginTop: -4,
    paddingTop: 12,
  },
  reminderMockPhone: {
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderColor: '#E1E1E1',
    borderRadius: 46,
    borderWidth: 2,
    gap: 16,
    maxWidth: 520,
    minHeight: 462,
    paddingHorizontal: 24,
    paddingTop: 22,
    width: '112%',
  },
  reminderMockPhoneCompact: {
    borderRadius: 40,
    gap: 12,
    minHeight: 398,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: '110%',
  },
  reminderMockPhoneVeryCompact: {
    borderRadius: 34,
    gap: 9,
    minHeight: 340,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  notificationPreview: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 22,
    boxShadow: '0 10px 24px rgba(55, 55, 55, 0.05)',
    flexDirection: 'row',
    gap: 12,
    minHeight: 74,
    opacity: 0.72,
    padding: 10,
    width: '94%',
  },
  notificationPreviewCompact: {
    borderRadius: 19,
    gap: 9,
    minHeight: 64,
    padding: 8,
    width: '92%',
  },
  notificationPreviewVeryCompact: {
    borderRadius: 16,
    gap: 8,
    minHeight: 62,
    padding: 8,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 13,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  notificationIconCompact: {
    borderRadius: 12,
    height: 48,
    width: 48,
  },
  notificationIconText: {
    color: '#191919',
    fontFamily: Fonts.rounded,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 33,
  },
  notificationIconTextCompact: {
    fontSize: 25,
    lineHeight: 29,
  },
  notificationBody: {
    flex: 1,
    gap: 2,
  },
  notificationTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  notificationAppName: {
    color: '#181818',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 17,
  },
  notificationNow: {
    color: '#282828',
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 17,
  },
  notificationTextCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  notificationMessage: {
    color: '#161616',
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 19,
  },
  notificationMessageCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  reminderOptions: {
    gap: 9,
    width: '100%',
  },
  reminderOptionsCompact: {
    gap: 7,
  },
  optionTouchTarget: {
    alignSelf: 'center',
    maxWidth: 500,
    width: '100%',
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    boxShadow: '0 10px 22px rgba(33, 33, 33, 0.06)',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 22,
    width: '100%',
  },
  optionCompact: {
    height: 48,
  },
  optionVeryCompact: {
    height: 44,
  },
  optionPressed: {
    transform: [{ scale: 0.985 }],
  },
  optionExpanded: {
    height: 'auto',
    minHeight: 126,
    paddingHorizontal: 28,
    paddingVertical: 22,
  },
  optionText: {
    color: '#151515',
    fontFamily: Fonts.rounded,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 23,
    textAlign: 'center',
  },
  optionTextCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  ageOptions: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  ageOptionsCompact: {
    gap: 3,
  },
  ageOptionTouchTarget: {
    alignSelf: 'center',
    maxWidth: 500,
    width: '100%',
  },
  ageOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    borderWidth: 1,
    boxShadow: '0 10px 22px rgba(33, 33, 33, 0.055)',
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  ageOptionCompact: {
    height: 42,
  },
  ageOptionVeryCompact: {
    height: 38,
  },
  ageOptionText: {
    color: '#151515',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 25,
    textAlign: 'center',
  },
  ageOptionTextCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  reminderOption: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    boxShadow: '0 12px 24px rgba(45, 45, 45, 0.045)',
    flexDirection: 'row',
    height: 74,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    width: '100%',
  },
  reminderOptionCompact: {
    borderRadius: 18,
    height: 66,
    paddingHorizontal: 18,
  },
  reminderOptionVeryCompact: {
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  reminderCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 14,
  },
  reminderLabel: {
    color: '#101010',
    fontFamily: Fonts.rounded,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 19,
  },
  reminderLabelCompact: {
    fontSize: 16,
    lineHeight: 19,
  },
  reminderTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  reminderTime: {
    color: '#090909',
    fontFamily: Fonts.rounded,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 35,
  },
  reminderTimeCompact: {
    fontSize: 25,
    lineHeight: 28,
  },
  reminderChevron: {
    color: '#111111',
    fontFamily: Fonts.sans,
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 35,
  },
  reminderChevronCompact: {
    fontSize: 32,
    lineHeight: 33,
  },
  reminderSwitchTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 68,
  },
  reminderSwitch: {
    alignItems: 'flex-end',
    backgroundColor: '#88A1E6',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 60,
  },
  reminderSwitchOff: {
    alignItems: 'flex-start',
    backgroundColor: '#D8D8D8',
  },
  reminderSwitchCompact: {
    height: 30,
    paddingHorizontal: 3,
    width: 52,
  },
  reminderSwitchThumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    boxShadow: '0 2px 4px rgba(40, 40, 40, 0.12)',
    height: 28,
    width: 28,
  },
  reminderSwitchThumbOff: {
    boxShadow: '0 2px 4px rgba(40, 40, 40, 0.08)',
  },
  reminderSwitchThumbCompact: {
    height: 24,
    width: 24,
  },
  timePickerBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerSheet: {
    backgroundColor: '#FCFCF8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    width: '100%',
  },
  timePickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  timePickerAction: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 72,
  },
  timePickerCancelText: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
  timePickerDoneText: {
    color: '#111111',
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'right',
  },
  timePickerTitle: {
    color: '#111111',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  factText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 430,
    textAlign: 'center',
  },
  factTextCompact: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  note: {
    color: '#8F8F8F',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  noteCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  ageNote: {
    fontSize: 17,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 32,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    width: 196,
  },
  continueButtonCompact: {
    height: 56,
    width: 184,
  },
  continueButtonVeryCompact: {
    height: 52,
    width: 174,
  },
  continuePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 26,
  },
  continueTextCompact: {
    fontSize: 19,
    lineHeight: 23,
  },
});
