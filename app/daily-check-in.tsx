import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { saveDailyCheckIn } from '@/lib/daily-checkins';
import { buttonHaptic, selectionHaptic, successHaptic } from '@/lib/haptics';

type FocusOption = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const FOCUSES: FocusOption[] = [
  { icon: 'briefcase-outline', label: 'Work' },
  { icon: 'checkbox-outline', label: 'Productivity' },
  { icon: 'heart-outline', label: 'Health' },
  { icon: 'barbell-outline', label: 'Strength' },
  { icon: 'book-outline', label: 'Learning' },
  { icon: 'cash-outline', label: 'Finances' },
  { icon: 'people-outline', label: 'People' },
  { icon: 'home-outline', label: 'Family' },
  { icon: 'checkmark-circle-outline', label: 'Discipline' },
];

const STEP_COUNT = 4;

type CheckInStep = 'rested' | 'focus' | 'goals' | 'plan';

const STEPS: CheckInStep[] = ['rested', 'focus', 'goals', 'plan'];

type RestedSliderProps = {
  onChange: (value: number) => void;
  value: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function RestedSlider({ onChange, value }: RestedSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const lastHapticValue = useRef(value);
  const progress = (value - 1) / 9;

  useEffect(() => {
    lastHapticValue.current = value;
  }, [value]);

  const updateFromLocation = (locationX: number) => {
    if (!trackWidth) {
      return;
    }

    const nextValue = clamp(Math.round((clamp(locationX, 0, trackWidth) / trackWidth) * 9) + 1, 1, 10);
    if (nextValue !== lastHapticValue.current) {
      selectionHaptic();
      lastHapticValue.current = nextValue;
    }
    onChange(nextValue);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateFromLocation(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateFromLocation(event.nativeEvent.locationX);
    },
    onStartShouldSetPanResponder: () => true,
  });

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      accessibilityLabel="How rested you feel"
      accessibilityRole="adjustable"
      accessibilityValue={{ max: 10, min: 1, now: value, text: `${value} out of 10` }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          const nextValue = clamp(value + 1, 1, 10);
          if (nextValue !== lastHapticValue.current) {
            selectionHaptic();
            lastHapticValue.current = nextValue;
          }
          onChange(nextValue);
        } else if (event.nativeEvent.actionName === 'decrement') {
          const nextValue = clamp(value - 1, 1, 10);
          if (nextValue !== lastHapticValue.current) {
            selectionHaptic();
            lastHapticValue.current = nextValue;
          }
          onChange(nextValue);
        }
      }}
      style={styles.sliderArea}>
      <View
        {...panResponder.panHandlers}
        onLayout={onTrackLayout}
        style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]}>
          <Text style={styles.sliderThumbText}>{value}</Text>
        </View>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>Drained</Text>
        <Text style={styles.sliderLabel}>Rested</Text>
      </View>
    </View>
  );
}

export default function DailyCheckInScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [restedScore, setRestedScore] = useState(6);
  const [focuses, setFocuses] = useState<string[]>([]);
  const [goalsText, setGoalsText] = useState('');
  const [actionPlanText, setActionPlanText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const isVeryCompact = height < 700;
  const step = STEPS[stepIndex];
  const progress = (stepIndex + 1) / STEP_COUNT;
  const isWritingStep = step === 'goals' || step === 'plan';
  const progressFill = useSharedValue(0);
  const footerBottomPadding = Math.max(insets.bottom, 18);
  const footerControlHeight = isWritingStep ? 64 : 58;
  const footerHeight = footerControlHeight + 16 + footerBottomPadding;
  const keyboardIsVisible = keyboardHeight > 0;
  const footerBottom = isWritingStep && keyboardIsVisible ? keyboardHeight : 0;

  const progressFillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressFill.value * 100}%`,
  }));

  useEffect(() => {
    progressFill.value = withTiming(progress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressFill]);

  useEffect(() => {
    const showEvent = process.env.EXPO_OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = process.env.EXPO_OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const canContinue = useMemo(() => {
    if (step === 'focus') {
      return focuses.length > 0;
    }

    if (step === 'goals') {
      return goalsText.trim().length > 0;
    }

    if (step === 'plan') {
      return actionPlanText.trim().length > 0;
    }

    return true;
  }, [actionPlanText, focuses.length, goalsText, step]);

  const toggleFocus = (focus: string) => {
    selectionHaptic();

    setFocuses((currentFocuses) => {
      if (currentFocuses.includes(focus)) {
        return currentFocuses.filter((item) => item !== focus);
      }

      if (currentFocuses.length >= 3) {
        return currentFocuses;
      }

      return [...currentFocuses, focus];
    });
  };

  const goBack = () => {
    buttonHaptic();

    if (isWritingStep) {
      Keyboard.dismiss();
    }

    if (stepIndex === 0) {
      router.back();
      return;
    }

    setStepIndex((current) => current - 1);
  };

  const continueCheckIn = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    buttonHaptic();

    if (isWritingStep) {
      Keyboard.dismiss();
    }

    if (stepIndex < STEP_COUNT - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setIsSaving(true);

    try {
      const createdAt = new Date().toISOString();

      await saveDailyCheckIn({
        actionPlanText: actionPlanText.trim(),
        createdAt,
        focuses,
        goalsText: goalsText.trim(),
        id: `${createdAt}-${Math.random().toString(36).slice(2, 10)}`,
        restedScore,
      });

      successHaptic();
      router.replace('/home');
    } finally {
      setIsSaving(false);
    }
  };

  const title =
    step === 'rested'
      ? 'How rested do you feel?'
      : step === 'focus'
        ? 'What needs your focus today?'
        : step === 'goals'
          ? 'Write out your goals.'
          : 'How will you work toward them?';

  const subtitle =
    step === 'rested'
      ? 'Slide to capture your starting energy before you choose the work.'
      : step === 'focus'
        ? 'Choose up to three areas that deserve your best effort.'
        : step === 'goals'
          ? 'Name the outcomes you want to move forward today.'
          : 'Turn those goals into the moves you can actually make today.';

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <StatusBar style="dark" />
      <View
        style={[
          styles.content,
          isCompact && styles.contentCompact,
          isVeryCompact && styles.contentVeryCompact,
          {
            paddingBottom: footerHeight + (isCompact ? 16 : 24),
            paddingTop: Math.max(insets.top + (isCompact ? 8 : 14), 44),
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={14}
            onPress={goBack}
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
            <Ionicons color="#777777" name="chevron-back" size={28} />
          </Pressable>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressFillAnimatedStyle]} />
          </View>
        </View>

        {isWritingStep ? null : (
          <View
            style={[
              styles.header,
              isCompact && styles.headerCompact,
              isVeryCompact && styles.headerVeryCompact,
            ]}>
            <Text
              style={[
                styles.title,
                isCompact && styles.titleCompact,
                isVeryCompact && styles.titleVeryCompact,
              ]}>
              {title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isCompact && styles.subtitleCompact,
                isVeryCompact && styles.subtitleVeryCompact,
              ]}>
              {subtitle}
            </Text>
          </View>
        )}

        {step === 'rested' ? (
          <View
            style={[
              styles.restedCard,
              isCompact && styles.restedCardCompact,
              isVeryCompact && styles.restedCardVeryCompact,
            ]}>
            <Text
              style={[
                styles.restedScore,
                isCompact && styles.restedScoreCompact,
                isVeryCompact && styles.restedScoreVeryCompact,
              ]}>
              {restedScore}
            </Text>
            <Text
              style={[styles.restedScoreLabel, isVeryCompact && styles.restedScoreLabelCompact]}>
              out of 10
            </Text>
            <RestedSlider value={restedScore} onChange={setRestedScore} />
          </View>
        ) : null}

        {step === 'focus' ? (
          <View style={styles.focusGrid}>
            {FOCUSES.map((focus) => {
              const isSelected = focuses.includes(focus.label);
              const isDisabled = !isSelected && focuses.length >= 3;

              return (
                <Pressable
                  accessibilityLabel={focus.label}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                  disabled={isDisabled}
                  key={focus.label}
                  onPress={() => toggleFocus(focus.label)}
                  style={({ pressed }) => [
                    styles.focusOption,
                    isSelected && styles.focusOptionSelected,
                    isDisabled && styles.focusOptionDisabled,
                    pressed && styles.focusOptionPressed,
                  ]}>
                  <Ionicons
                    color={isSelected ? '#FFFFFF' : isDisabled ? '#8A8A82' : '#181818'}
                    name={focus.icon}
                    size={28}
                  />
                  <Text
                    style={[
                      styles.focusOptionText,
                      isSelected && styles.focusOptionTextSelected,
                      isDisabled && styles.focusOptionTextDisabled,
                    ]}>
                    {focus.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {isWritingStep ? (
          <View
            style={[
              styles.editor,
              isCompact && styles.editorCompact,
              isVeryCompact && styles.editorVeryCompact,
            ]}>
            <Text
              style={[
                styles.editorTitle,
                isCompact && styles.editorTitleCompact,
                isVeryCompact && styles.editorTitleVeryCompact,
              ]}>
              {step === 'goals' ? 'Goals' : 'Plan'}
            </Text>
            <TextInput
              multiline
              onChangeText={step === 'goals' ? setGoalsText : setActionPlanText}
              placeholder={step === 'goals' ? 'By the end of today, I want to...' : 'I will make progress by...'}
              placeholderTextColor="#A4A49C"
              returnKeyType="default"
              style={[
                styles.editorInput,
                isCompact && styles.editorInputCompact,
                isVeryCompact && styles.editorInputVeryCompact,
              ]}
              textAlignVertical="top"
              value={step === 'goals' ? goalsText : actionPlanText}
            />
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.footer,
          isWritingStep && styles.editorFooter,
          { bottom: footerBottom, paddingBottom: footerBottomPadding },
        ]}>
        {isWritingStep ? (
          <View style={styles.editorActionRow}>
            <Pressable
              accessibilityLabel="Add to reflection"
              accessibilityRole="button"
              onPress={() => {
                selectionHaptic();
              }}
              style={({ pressed }) => [
                styles.editorIconButton,
                pressed && styles.editorActionPressed,
              ]}>
              <Ionicons color="#171717" name="add" size={32} />
            </Pressable>

            <Pressable
              accessibilityLabel={stepIndex === STEP_COUNT - 1 ? 'Save check-in' : 'Continue'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue || isSaving }}
              disabled={!canContinue || isSaving}
              onPress={continueCheckIn}
              style={({ pressed }) => [
                styles.editorCheckButton,
                (!canContinue || isSaving) && styles.editorCheckButtonDisabled,
                pressed && styles.editorActionPressed,
              ]}>
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons color="#FFFFFF" name="checkmark" size={30} />
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue || isSaving }}
            disabled={!canContinue || isSaving}
            onPress={continueCheckIn}
            style={({ pressed }) => [
              styles.continueButton,
              (!canContinue || isSaving) && styles.continueButtonDisabled,
              pressed && styles.continueButtonPressed,
            ]}>
            <Text style={styles.continueText}>
              {stepIndex === STEP_COUNT - 1 ? (isSaving ? 'Saving...' : 'Save Check-In') : 'Continue'}
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FCFCF8',
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 24,
  },
  contentCompact: {
    gap: 18,
  },
  contentVeryCompact: {
    gap: 14,
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pressed: {
    opacity: 0.55,
  },
  progressTrack: {
    backgroundColor: '#E7E7DF',
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: '100%',
  },
  header: {
    gap: 12,
    paddingTop: 10,
  },
  headerCompact: {
    gap: 9,
    paddingTop: 4,
  },
  headerVeryCompact: {
    gap: 7,
    paddingTop: 0,
  },
  title: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
  },
  titleCompact: {
    fontSize: 29,
    lineHeight: 35,
  },
  titleVeryCompact: {
    fontSize: 27,
    lineHeight: 32,
  },
  subtitle: {
    color: '#74746D',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 23,
  },
  subtitleVeryCompact: {
    fontSize: 15,
    lineHeight: 21,
  },
  restedCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#ECECE4',
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  restedCardCompact: {
    borderRadius: 26,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  restedCardVeryCompact: {
    borderRadius: 24,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  restedScore: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 74,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 78,
  },
  restedScoreCompact: {
    fontSize: 64,
    lineHeight: 68,
  },
  restedScoreVeryCompact: {
    fontSize: 56,
    lineHeight: 60,
  },
  restedScoreLabel: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  restedScoreLabelCompact: {
    fontSize: 15,
  },
  sliderArea: {
    gap: 18,
    paddingTop: 18,
    width: '100%',
  },
  sliderTrack: {
    backgroundColor: '#E8E8E0',
    borderRadius: 999,
    height: 18,
    justifyContent: 'center',
    width: '100%',
  },
  sliderFill: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: '100%',
  },
  sliderThumb: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 4,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    top: -15,
    transform: [{ translateX: -24 }],
    width: 48,
  },
  sliderThumbText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: 0,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  focusOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E8E0',
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 104,
    paddingHorizontal: 8,
    paddingVertical: 14,
    width: '30.5%',
  },
  focusOptionSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  focusOptionDisabled: {
    opacity: 0.36,
  },
  focusOptionPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  focusOptionText: {
    color: '#181818',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 16,
    textAlign: 'center',
  },
  focusOptionTextSelected: {
    color: '#FFFFFF',
  },
  focusOptionTextDisabled: {
    color: '#8A8A82',
  },
  editor: {
    flex: 1,
    gap: 14,
    paddingTop: 20,
  },
  editorCompact: {
    gap: 12,
    paddingTop: 12,
  },
  editorVeryCompact: {
    gap: 10,
    paddingTop: 8,
  },
  editorTitle: {
    color: '#151515',
    fontFamily: Fonts.rounded,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 48,
  },
  editorTitleCompact: {
    fontSize: 38,
    lineHeight: 44,
  },
  editorTitleVeryCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  editorInput: {
    color: '#252520',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 31,
    padding: 0,
  },
  editorInputCompact: {
    fontSize: 20,
    lineHeight: 28,
  },
  editorInputVeryCompact: {
    fontSize: 18,
    lineHeight: 25,
  },
  footer: {
    backgroundColor: '#FCFCF8',
    borderTopColor: '#EEEEEA',
    borderTopWidth: 1,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  editorFooter: {
    backgroundColor: 'rgba(252, 252, 248, 0.96)',
    borderTopWidth: 0,
    paddingTop: 8,
  },
  editorActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editorIconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E7DF',
    borderCurve: 'continuous',
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  editorCheckButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderCurve: 'continuous',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  editorCheckButtonDisabled: {
    backgroundColor: '#BDBDB5',
  },
  editorActionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#BDBDB5',
  },
  continueButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
