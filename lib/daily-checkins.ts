import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_CHECKINS_STORAGE_KEY = 'north-star:daily-checkins';

export type DailyCheckIn = {
  actionPlanText: string;
  createdAt: string;
  focuses: string[];
  goalsText: string;
  id: string;
  restedScore: number;
};

function isDailyCheckIn(value: unknown): value is DailyCheckIn {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const checkIn = value as DailyCheckIn;

  return (
    typeof checkIn.actionPlanText === 'string' &&
    typeof checkIn.createdAt === 'string' &&
    Array.isArray(checkIn.focuses) &&
    checkIn.focuses.every((focus) => typeof focus === 'string') &&
    typeof checkIn.goalsText === 'string' &&
    typeof checkIn.id === 'string' &&
    typeof checkIn.restedScore === 'number'
  );
}

export async function loadDailyCheckIns() {
  const storedValue = await AsyncStorage.getItem(DAILY_CHECKINS_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isDailyCheckIn)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  } catch {
    return [];
  }
}

export async function saveDailyCheckIn(checkIn: DailyCheckIn) {
  const currentCheckIns = await loadDailyCheckIns();
  const nextCheckIns = [checkIn, ...currentCheckIns];

  await AsyncStorage.setItem(DAILY_CHECKINS_STORAGE_KEY, JSON.stringify(nextCheckIns));

  return nextCheckIns;
}
