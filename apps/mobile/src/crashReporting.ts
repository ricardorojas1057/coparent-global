import { Platform } from 'react-native';

let crashReportingEnabled = false;

export async function configureCrashReporting(allowProductAnalytics: boolean) {
  if (Platform.OS === 'web' || (!allowProductAnalytics && !crashReportingEnabled)) return;

  const { getCrashlytics, log, setCrashlyticsCollectionEnabled } = await import(
    '@react-native-firebase/crashlytics'
  );
  const crashlytics = getCrashlytics();

  await setCrashlyticsCollectionEnabled(crashlytics, allowProductAnalytics);
  crashReportingEnabled = allowProductAnalytics;

  if (allowProductAnalytics) {
    log(crashlytics, 'mobile_session_started');
  }
}
