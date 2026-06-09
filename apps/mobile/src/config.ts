import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra as {
  apiUrl?: string;
  googleAndroidClientId?: string;
  googleWebClientId?: string;
  publicWebUrl?: string;
} | undefined;

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  extra?.apiUrl ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export const PUBLIC_WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ??
  extra?.publicWebUrl ??
  'https://coparent-global.vercel.app';

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  extra?.googleWebClientId ??
  '30610428855-ueh3tipa2h3aj508eufk3i4fphhd2qit.apps.googleusercontent.com';

export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
  extra?.googleAndroidClientId ??
  '30610428855-foj7hpfcptq377h8lqpnedenqa3ta1mf.apps.googleusercontent.com';
