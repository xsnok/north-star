import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';

const FEATURES = [
  {
    description: 'Get custom prompts based on your focuses by Seneca, Marcus Aurelius, and more',
    icon: 'draw-pen',
    title: 'Personalized Reflections',
  },
  {
    description: 'Use AI to analyze your entries, uncover patterns and get follow-up prompts',
    icon: 'lightbulb-on-outline',
    title: 'Reflective Analysis',
  },
  {
    description: 'Get personalized notifications based on your journaling rhythm',
    icon: 'weather-cloudy-clock',
    title: 'Smart Notifications',
  },
  {
    description: 'Build a daily practice with guided reflections and streak-friendly nudges',
    icon: 'calendar-check-outline',
    title: 'Guided Routine',
  },
] as const;

export function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const footerHeight = isCompact ? 218 : 250;
  const footerBottomPadding = Math.max(insets.bottom, 18);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: footerHeight + footerBottomPadding + 24,
            paddingTop: Math.max(insets.top + (isCompact ? 18 : 34), 52),
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.segmentedControl}>
            <View style={styles.segment}>
              <Text style={styles.segmentText}>Premium</Text>
            </View>
            <View style={styles.segmentSelected}>
              <Text style={styles.segmentSelectedText}>Premium + AI</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Close payment screen"
            accessibilityRole="button"
            hitSlop={14}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color="#111111" name="close" size={34} />
          </Pressable>
        </View>

        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            Be more{'\n'}productive with{'\n'}North Star.
          </Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
            with <Text style={styles.subtitleStrong}>36% off</Text> on premium features.
          </Text>
        </View>

        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>N.</Text>
        </View>

        <View style={[styles.featureCard, isCompact && styles.featureCardCompact]}>
          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              style={[
                styles.featureRow,
                isCompact && styles.featureRowCompact,
                index < FEATURES.length - 1 && styles.featureRowDivider,
              ]}>
              <View style={styles.iconSlot}>
                <MaterialCommunityIcons color="#050505" name={feature.icon} size={45} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={[styles.featureTitle, isCompact && styles.featureTitleCompact]}>
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    isCompact && styles.featureDescriptionCompact,
                  ]}>
                  {feature.description}
                </Text>
              </View>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: footerBottomPadding,
          },
        ]}>
        <View style={styles.planCopy}>
          <Text style={styles.planTitle}>Yearly + AI</Text>
          <Text style={styles.planPrice}>$99.99 annually ($8.33/month)</Text>
          <Text style={styles.cancelText}>Cancel anytime</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
          <Text style={styles.ctaText}>Try 3 days free</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F4F4',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    minHeight: 64,
    width: '100%',
  },
  segmentedControl: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    maxWidth: 320,
    padding: 5,
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  segmentSelected: {
    alignItems: 'center',
    backgroundColor: '#5F5F5F',
    borderRadius: 999,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  segmentText: {
    color: '#111111',
    fontFamily: Fonts.sans,
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: 0,
  },
  segmentSelectedText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  closeButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.55,
  },
  hero: {
    gap: 26,
    paddingTop: 60,
    width: '100%',
    zIndex: 2,
  },
  heroCompact: {
    gap: 18,
    paddingTop: 38,
  },
  title: {
    color: '#101014',
    fontFamily: Fonts.rounded,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 56,
  },
  titleCompact: {
    fontSize: 38,
    lineHeight: 50,
  },
  subtitle: {
    color: '#7C7C82',
    fontFamily: Fonts.rounded,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 36,
    maxWidth: 330,
  },
  subtitleCompact: {
    fontSize: 23,
    lineHeight: 32,
  },
  subtitleStrong: {
    color: '#5F5F5F',
  },
  watermark: {
    opacity: 0.035,
    position: 'absolute',
    right: -42,
    top: 224,
    transform: [{ rotate: '-10deg' }],
    zIndex: 0,
  },
  watermarkText: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 280,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 296,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    boxShadow: '0 16px 34px rgba(20, 20, 20, 0.055)',
    marginTop: 76,
    overflow: 'hidden',
    width: '100%',
    zIndex: 2,
  },
  featureCardCompact: {
    marginTop: 54,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    minHeight: 152,
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  featureRowCompact: {
    gap: 15,
    minHeight: 132,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  featureRowDivider: {
    borderBottomColor: '#E1E1E1',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
  },
  featureCopy: {
    flex: 1,
    gap: 8,
  },
  featureTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 27,
  },
  featureTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  featureDescription: {
    color: '#858585',
    fontFamily: Fonts.sans,
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 30,
  },
  featureDescriptionCompact: {
    fontSize: 18,
    lineHeight: 25,
  },
  aiBadge: {
    alignItems: 'center',
    backgroundColor: '#737373',
    borderRadius: 999,
    height: 50,
    justifyContent: 'center',
    minWidth: 66,
    paddingHorizontal: 18,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderTopColor: '#D7D7D7',
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    gap: 26,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    position: 'absolute',
    right: 0,
  },
  planCopy: {
    alignItems: 'center',
    gap: 7,
  },
  planTitle: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 27,
    textAlign: 'center',
  },
  planPrice: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 27,
    textAlign: 'center',
  },
  cancelText: {
    color: '#111111',
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 27,
    textAlign: 'center',
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: '#5F5F5F',
    borderRadius: 999,
    height: 76,
    justifyContent: 'center',
    maxWidth: 320,
    width: '100%',
  },
  ctaButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
  },
});
