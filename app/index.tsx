import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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

type ReasonOptionProps = {
  fact: string;
  isCompact: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isVeryCompact: boolean;
  onPress: () => void;
  reason: string;
};

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

export default function OnboardingScreen() {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const isVeryCompact = height < 700;
  const continueButtonHeight = isVeryCompact ? 52 : isCompact ? 56 : 62;
  const footerGap = isCompact ? 12 : 16;
  const noteHeight = isCompact ? 40 : 52;
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
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            hitSlop={16}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.main,
            {
              paddingTop: isVeryCompact ? 10 : isCompact ? 20 : 28,
            },
          ]}>
          <View style={[styles.copy, isVeryCompact && styles.copyCompact]}>
            <Text style={[styles.title, isVeryCompact && styles.titleCompact]}>
              What’s on your mind?
            </Text>
            <Text style={[styles.subtitle, isVeryCompact && styles.subtitleCompact]}>
              Your answers will help shape the app{'\n'}around your needs.
            </Text>
          </View>

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

        </View>
      </View>

      <View style={[styles.footer, { bottom: footerBottomOffset, gap: footerGap }]}>
        <Text style={[styles.note, isCompact && styles.noteCompact]}>
          Your selections won’t limit access to{'\n'}any features.
        </Text>
        <Pressable
          accessibilityRole="button"
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
  copy: {
    alignItems: 'center',
    gap: 16,
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
