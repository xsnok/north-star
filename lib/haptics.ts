import * as Haptics from 'expo-haptics';

function triggerHaptic(effect: () => Promise<void>) {
  if (process.env.EXPO_OS === 'web') {
    return;
  }

  void effect().catch(() => {});
}

export function selectionHaptic() {
  triggerHaptic(() => Haptics.selectionAsync());
}

export function buttonHaptic() {
  triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function successHaptic() {
  triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
