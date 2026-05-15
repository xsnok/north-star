import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ComponentProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { buttonHaptic } from '@/lib/haptics';

export type LiquidGlassTab = 'home' | 'ideas' | 'explore' | 'history' | 'trends';

type LiquidGlassNavbarProps = {
  activeTab: LiquidGlassTab;
  onTabPress?: (tab: LiquidGlassTab) => void;
};

type NavItem = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  tab: LiquidGlassTab;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'home-outline', label: 'Home', tab: 'home' },
  { icon: 'bulb-outline', label: 'Ideas', tab: 'ideas' },
  { icon: 'compass-outline', label: 'Explore', tab: 'explore' },
  { icon: 'book-outline', label: 'History', tab: 'history' },
  { icon: 'stats-chart-outline', label: 'Trends', tab: 'trends' },
];

export const LIQUID_GLASS_NAVBAR_RESERVED_HEIGHT = 132;

export function LiquidGlassNavbar({ activeTab, onTabPress }: LiquidGlassNavbarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom + 10, 20);

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={styles.shadowShell}>
        <View style={styles.glassShell}>
          <NavbarChrome activeTab={activeTab} onTabPress={onTabPress} />
        </View>
      </View>
    </View>
  );
}

function NavbarChrome({ activeTab, onTabPress }: LiquidGlassNavbarProps) {
  return (
    <>
      <View style={styles.baseTint} />
      <View style={styles.topHighlight} />
      <View style={styles.innerGlow} />
      <View style={styles.itemRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.tab === activeTab;
          const isPlaceholder = item.tab !== 'home';
          const isDisabled = isPlaceholder || !onTabPress;

          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDisabled, selected: isActive }}
              disabled={isDisabled}
              key={item.tab}
              onPress={() => {
                if (!onTabPress) {
                  return;
                }

                buttonHaptic();
                onTabPress(item.tab);
              }}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.activeItem,
                pressed && styles.pressed,
              ]}>
              <Ionicons color={isActive ? '#141412' : '#343430'} name={item.icon} size={26} />
              <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: 14,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  shadowShell: {
    borderRadius: 42,
    maxWidth: 680,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: '100%',
  },
  glassShell: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 42,
    borderWidth: 1,
    minHeight: 86,
    overflow: 'hidden',
  },
  baseTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 238, 0.48)',
  },
  topHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    height: 1,
    left: 26,
    position: 'absolute',
    right: 26,
    top: 1,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255, 255, 255, 0.46)',
    borderRadius: 41,
    borderWidth: 1,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 86,
    padding: 8,
  },
  item: {
    alignItems: 'center',
    borderRadius: 34,
    flex: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 70,
    paddingHorizontal: 4,
  },
  activeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    flex: 1.34,
    shadowColor: '#000000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: '#2E2E2B',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 16,
  },
  activeLabel: {
    color: '#161614',
    fontSize: 15,
    fontWeight: '900',
  },
});
