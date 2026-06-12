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

export async function sendCrashReportingTest() {
  if (Platform.OS === 'web' || !crashReportingEnabled) {
    throw new Error('Crash reporting is not enabled.');
  }

  const { getCrashlytics, log, recordError } = await import('@react-native-firebase/crashlytics');
  const crashlytics = getCrashlytics();

  log(crashlytics, 'user_requested_diagnostic_test');
  recordError(crashlytics, new Error('Coparent Global controlled diagnostic test'));
}
