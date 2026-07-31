import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { useShareIntent, type ShareIntent } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  getAvailablePurchases as queryAvailablePurchases,
  useIAP,
  type ProductSubscription,
} from 'expo-iap';
import {
  CalendarDays,
  Home,
  MessageCircle,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, PUBLIC_WEB_URL } from './src/config';
import {
  AuthMode,
  AuthenticatedUser,
  CalendarEvent,
  CalendarChangeRequest,
  CalendarEventType,
  Expense,
  ExpenseCategory,
  ExpenseMonthlyReport,
  ExpenseSplitMode,
  ExpenseSummary,
  Family,
  FamilyMessage,
  FamilySubscriptionState,
  MessageReview,
  PrivacyState,
  RelationshipMode,
  SubscriptionPlan,
  WhatsAppLink,
  WhatsAppLinkCode,
  WhatsAppPendingAction,
  acceptFamilyInvitation,
  cancelWhatsAppAction,
  cancelAccountDeletion,
  cancelCalendarEvent,
  confirmWhatsAppAction,
  confirmAccountDeletion,
  createCalendarEvent,
  createExpense,
  createChild,
  createFamily,
  createFamilyInvitation,
  createFamilyMessage,
  createTenant,
  createSharedWhatsAppAction,
  createWhatsAppLinkCode,
  executeQueuedMutation,
  exportBasicFamilyHtml,
  exportFamilyArchive,
  getCurrentUser,
  getCalendarChangeRequests,
  getCalendarEvents,
  getExpenses,
  getExpenseMonthlyReport,
  getExpenseSummary,
  getFamilyInvitationPreview,
  getFamilyMessages,
  getFamilySubscription,
  getMyFamilies,
  getPrivacy,
  getWhatsAppActions,
  getWhatsAppLinks,
  login,
  markExpenseAllocationPaid,
  requestAccountDeletion,
  requestPasswordReset,
  requestEmailVerification,
  requestCalendarChange,
  requestFamilyPlanChange,
  resolveCalendarChange,
  reviewFamilyMessage,
  register,
  registerPushDevice,
  deleteChild,
  updateChild,
  updateCalendarEvent,
  updateExpenseAllocationStatus,
  updateFamilySettings,
  updatePrivacy,
  updateWhatsAppAction,
  uploadExpenseReceipt,
  verifyGooglePlayPurchase,
} from './src/api';
import {
  cacheData,
  clearOfflineData,
  createMutationId,
  flushQueuedMutations,
  getCachedData,
  getQueuedMutations,
  queueMutation,
} from './src/offline';
import { SupportedLanguage, translate } from './src/i18n';
import { getExpoPushToken } from './src/notifications';
import { configureCrashReporting, sendCrashReportingTest } from './src/crashReporting';

type AuthForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type ChildForm = {
  firstName: string;
  lastName: string;
  birthDate: string;
  observations: string;
};

type BirthDatePart = 'day' | 'month' | 'year';

type BirthDateParts = {
  day: string;
  month: string;
  year: string;
};

type AppTab = 'home' | 'calendar' | 'messages' | 'expenses' | 'profile' | 'plans' | 'settings' | 'privacy' | 'exports';

type SharedReceiptFile = {
  fileName: string;
  mimeType: string;
  path: string;
  size: number | null;
};

type CalendarForm = {
  title: string;
  type: CalendarEventType;
  childId: string;
  currentParentId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  notes: string;
};

type CalendarPickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime';

type ExpenseForm = {
  description: string;
  amount: string;
  category: ExpenseCategory;
  paidById: string;
  splitMode: ExpenseSplitMode;
  receiptReference: string;
};

const expenseCategories: Array<{ value: ExpenseCategory; key: Parameters<typeof translate>[1] }> = [
  { value: 'SCHOOL', key: 'expenseSchool' },
  { value: 'HEALTH', key: 'expenseHealth' },
  { value: 'CLOTHING', key: 'expenseClothing' },
  { value: 'TRANSPORT', key: 'expenseTransport' },
  { value: 'FOOD', key: 'expenseFood' },
  { value: 'EXTRACURRICULAR', key: 'expenseExtracurricular' },
  { value: 'OTHER', key: 'expenseOther' },
];

const calendarEventTypes: Array<{ value: CalendarEventType; es: string; en: string }> = [
  { value: 'CARE', es: 'Cuidado', en: 'Care' },
  { value: 'SCHOOL', es: 'Escuela', en: 'School' },
  { value: 'HEALTH', es: 'Salud', en: 'Health' },
  { value: 'ACTIVITY', es: 'Actividad', en: 'Activity' },
  { value: 'PICKUP_DROPOFF', es: 'Entrega / retiro', en: 'Pickup / drop-off' },
  { value: 'OTHER', es: 'Otro', en: 'Other' },
];

const initialForm: AuthForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
};

const initialChildForm: ChildForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  observations: '',
};

const emptyBirthDateParts: BirthDateParts = {
  day: '',
  month: '',
  year: '',
};

const initialExpenseForm: ExpenseForm = {
  description: '',
  amount: '',
  category: 'OTHER',
  paidById: '',
  splitMode: 'SHARED',
  receiptReference: '',
};

const initialCalendarForm: CalendarForm = {
  title: '',
  type: 'CARE',
  childId: '',
  currentParentId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  notes: '',
};

const sessionTokenKey = 'coparent.sessionToken';
const appBuildLabel = `${Constants.expoConfig?.version ?? '0.10.0'} (${Constants.expoConfig?.android?.versionCode ?? 36})`;
const playTestingUrl = 'https://play.google.com/apps/testing/ar.coparent.app';

const authCopy: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  valuePillOne: string;
  valuePillTwo: string;
  valuePillThree: string;
  trialBadge: string;
  login: string;
  register: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  optionalPhone: string;
  createAccount: string;
  continueGoogle: string;
  forgotPassword: string;
  resendVerification: string;
  privacyNote: string;
  startFamily: string;
  receivedInvitation: string;
  useAlone: string;
  invitedNotice: string;
  useAloneCopy: string;
  firstStepTitle: string;
  firstStepCopy: string;
  testingHelp: string;
}> = {
  es: {
    title: 'Organizá la coparentalidad sin sumar conflicto',
    subtitle: 'Calendario, mensajes, gastos e invitaciones en un solo lugar, con foco en el bienestar de tus hijos.',
    valuePillOne: 'Calendario claro',
    valuePillTwo: 'Mensajes responsables',
    valuePillThree: 'Gastos ordenados',
    trialBadge: `Prueba cerrada · versión ${appBuildLabel}`,
    login: 'Ingresar',
    register: 'Registrarme',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    password: 'Contraseña',
    optionalPhone: 'Teléfono opcional',
    createAccount: 'Crear cuenta',
    continueGoogle: 'Continuar con Google',
    forgotPassword: 'Olvidé mi contraseña',
    resendVerification: 'Reenviar verificación de email',
    privacyNote: 'Privacidad visible: podés cambiar idioma, analítica, IA y eliminación de cuenta desde Perfil.',
    startFamily: 'Crear mi espacio familiar',
    receivedInvitation: 'Ya recibí una invitación',
    useAlone: 'Usar aunque la otra persona no participe',
    invitedNotice: 'Si te llegó un link por WhatsApp, abrilo en este celular. Después registrate o ingresá para aceptar la invitación.',
    useAloneCopy: 'Podés registrar eventos, gastos e intentos de comunicación aunque el otro progenitor todavía no use la app.',
    firstStepTitle: 'Primer paso',
    firstStepCopy: 'Creá tu cuenta, armá tu familia y luego compartí una invitación clara por WhatsApp.',
    testingHelp: 'Si Google Play dice “app no disponible”, pedile a quien te invitó que agregue tu Gmail como tester.',
  },
  en: {
    title: 'Organize co-parenting without adding conflict',
    subtitle: 'Calendar, messages, expenses and invitations in one place, focused on your children’s wellbeing.',
    valuePillOne: 'Clear calendar',
    valuePillTwo: 'Responsible messages',
    valuePillThree: 'Organized expenses',
    trialBadge: `Closed test · version ${appBuildLabel}`,
    login: 'Log in',
    register: 'Create account',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    optionalPhone: 'Optional phone',
    createAccount: 'Create account',
    continueGoogle: 'Continue with Google',
    forgotPassword: 'Forgot password',
    resendVerification: 'Resend email verification',
    privacyNote: 'Visible privacy: change language, analytics, AI and account deletion from Profile.',
    startFamily: 'Create my family space',
    receivedInvitation: 'I received an invitation',
    useAlone: 'Use it even if the other parent does not join',
    invitedNotice: 'If you received a WhatsApp link, open it on this phone. Then create an account or log in to accept the invitation.',
    useAloneCopy: 'You can record events, expenses and communication attempts even if the other parent is not using the app yet.',
    firstStepTitle: 'First step',
    firstStepCopy: 'Create your account, set up your family, then share a clear WhatsApp invitation.',
    testingHelp: 'If Google Play says the app is unavailable, ask the person who invited you to add your Gmail as a tester.',
  },
};

const monthNames: Record<SupportedLanguage, string[]> = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

function parseBirthDateParts(value: string): BirthDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return emptyBirthDateParts;
  return { year: match[1], month: match[2], day: match[3] };
}

function buildBirthDate(parts: BirthDateParts) {
  if (!parts.year || !parts.month || !parts.day) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getDaysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function getBirthYearOptions(selectedYear: string) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, index) => String(currentYear - index));
  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => Number(b) - Number(a));
  }
  return years;
}

function getBirthDateOptions(part: BirthDatePart, parts: BirthDateParts, language: SupportedLanguage) {
  if (part === 'day') {
    return Array.from({ length: getDaysInMonth(parts.year, parts.month) }, (_, index) => {
      const value = String(index + 1).padStart(2, '0');
      return { value, label: value };
    });
  }
  if (part === 'month') {
    return monthNames[language].map((month, index) => {
      const value = String(index + 1).padStart(2, '0');
      return { value, label: `${value} - ${month}` };
    });
  }
  return getBirthYearOptions(parts.year).map((year) => ({ value: year, label: year }));
}

function birthDatePickerTitle(part: BirthDatePart, language: SupportedLanguage) {
  if (part === 'day') return language === 'en' ? 'Choose day' : 'Elegir día';
  if (part === 'month') return language === 'en' ? 'Choose month' : 'Elegir mes';
  return language === 'en' ? 'Choose year' : 'Elegir año';
}

function toDateInputValue(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calendarPickerTitle(field: CalendarPickerField, language: SupportedLanguage) {
  const isStart = field.startsWith('start');
  const isTime = field.endsWith('Time');
  if (language === 'en') return `Choose ${isStart ? 'start' : 'end'} ${isTime ? 'time' : 'date'}`;
  return `Elegir ${isTime ? 'hora' : 'fecha'} de ${isStart ? 'inicio' : 'fin'}`;
}

function getCalendarPickerOptions(field: CalendarPickerField, language: SupportedLanguage) {
  if (field.endsWith('Time')) {
    return Array.from({ length: 48 }, (_, index) => {
      const hours = Math.floor(index / 2);
      const minutes = index % 2 === 0 ? '00' : '30';
      const value = `${String(hours).padStart(2, '0')}:${minutes}`;
      return { value, label: value };
    });
  }
  return Array.from({ length: 366 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const value = toDateInputValue(date.toISOString());
    const label = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
    return { value, label };
  });
}

export default function App() {
  const {
    hasShareIntent,
    shareIntent,
    resetShareIntent,
    error: shareIntentError,
  } = useShareIntent({
    disabled: Platform.OS === 'web' || Constants.appOwnership === 'expo',
    resetOnBackground: false,
  });

  return (
    <SafeAreaProvider>
      <AppContent
        hasShareIntent={hasShareIntent}
        shareIntent={shareIntent}
        resetShareIntent={resetShareIntent}
        shareIntentError={shareIntentError}
      />
    </SafeAreaProvider>
  );
}

function AppContent({
  hasShareIntent,
  shareIntent,
  resetShareIntent,
  shareIntentError,
}: {
  hasShareIntent: boolean;
  shareIntent: ShareIntent | null;
  resetShareIntent: () => void;
  shareIntentError: string | null;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthForm>(initialForm);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [pendingInvitationToken, setPendingInvitationToken] = useState<string | null>(null);
  const [authLanguage, setAuthLanguage] = useState<SupportedLanguage>('es');
  const authText = authCopy[authLanguage];

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = await SecureStore.getItemAsync(sessionTokenKey);
      if (!savedToken) {
        setIsRestoringSession(false);
        return;
      }
      try {
        const [currentUser, currentFamilies] = await Promise.all([
          getCurrentUser(savedToken),
          getMyFamilies(savedToken),
        ]);
        await Promise.all([
          cacheData('currentUser', currentUser),
          cacheData('families', currentFamilies),
        ]);
        setToken(savedToken);
        setUser(currentUser);
        setFamilies(currentFamilies);
      } catch {
        const [cachedUser, cachedFamilies] = await Promise.all([
          getCachedData<AuthenticatedUser>('currentUser'),
          getCachedData<Family[]>('families'),
        ]);
        if (savedToken && cachedUser && cachedFamilies) {
          setToken(savedToken);
          setUser(cachedUser);
          setFamilies(cachedFamilies);
        } else {
          await SecureStore.deleteItemAsync(sessionTokenKey);
        }
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const captureDeepLink = (url: string | null) => {
      const googleAuth = extractGoogleAuthResult(url);
      if (googleAuth?.accessToken) {
        setNotice(authLanguage === 'en' ? 'Google sign-in confirmed. Preparing your family space...' : 'Sesión de Google confirmada. Preparando tu espacio familiar...');
        completeAuth({ accessToken: googleAuth.accessToken }).catch((caught) => {
          setError(caught instanceof Error ? caught.message : authLanguage === 'en' ? 'We could not complete Google sign-in.' : 'No pudimos completar el inicio con Google.');
        });
        return;
      }
      if (googleAuth?.error) {
        setError(googleAuth.error);
        return;
      }

      const invitationToken = extractInvitationToken(url);
      if (invitationToken) {
        setPendingInvitationToken(invitationToken);
        setNotice(authLanguage === 'en' ? 'Invitation detected. Log in or create an account to review it.' : 'Invitación detectada. Iniciá sesión o registrate para revisarla.');
      }
    };
    Linking.getInitialURL().then(captureDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => captureDeepLink(url));
    return () => subscription.remove();
  }, []);

  const updateForm = (field: keyof AuthForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const completeAuth = async (auth: { accessToken: string }) => {
    const currentUser = await getCurrentUser(auth.accessToken);
    const currentFamilies = await getMyFamilies(auth.accessToken);
    await SecureStore.setItemAsync(sessionTokenKey, auth.accessToken);
    await Promise.all([
      cacheData('currentUser', currentUser),
      cacheData('families', currentFamilies),
    ]);
    setToken(auth.accessToken);
    setUser(currentUser);
    setFamilies(currentFamilies);
  };

  const submit = async () => {
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await completeAuth(await login({ email: form.email.trim(), password: form.password }));
      } else {
        const auth = await register({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
        });
        if ('requiresEmailVerification' in auth) {
          setMode('login');
          setNotice(auth.message);
        } else {
          await completeAuth(auth);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitGoogle = async () => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      await startGoogleBrowserLogin();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : authLanguage === 'en' ? 'We could not open Google in the browser.' : 'No pudimos abrir Google en el navegador.');
    } finally {
      setIsLoading(false);
    }
  };

  const startGoogleBrowserLogin = async () => {
    const startUrl = `${API_URL.replace(/\/$/, '')}/auth/google/mobile/start`;
    setNotice(authLanguage === 'en' ? 'We opened Google in the browser to complete sign-in.' : 'Abrimos Google en el navegador para completar el ingreso.');
    await Linking.openURL(startUrl);
  };

  const forgotPassword = async () => {
    if (!form.email.trim()) {
      setError(authLanguage === 'en' ? 'Enter your email to recover access.' : 'Ingresá tu email para recuperar el acceso.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(form.email.trim());
      setNotice(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : authLanguage === 'en' ? 'We could not request password recovery.' : 'No pudimos solicitar la recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!form.email.trim()) {
      setError(authLanguage === 'en' ? 'Enter your email to resend verification.' : 'Ingresá tu email para reenviar la verificación.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await requestEmailVerification(form.email.trim());
      setNotice(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : authLanguage === 'en' ? 'We could not resend verification.' : 'No pudimos reenviar la verificación.');
    } finally {
      setIsLoading(false);
    }
  };

  const chooseInvitationFlow = () => {
    setMode('register');
    setNotice(authText.invitedNotice);
  };

  const chooseStandaloneFlow = () => {
    setMode('register');
    setNotice(authText.useAloneCopy);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(sessionTokenKey);
    await clearOfflineData();
    setToken(null);
    setUser(null);
    setFamilies([]);
    setError(null);
    setForm(initialForm);
  };

  const refreshFamilies = async () => {
    if (!token) {
      return;
    }

    const latestFamilies = await getMyFamilies(token);
    await cacheData('families', latestFamilies);
    setFamilies(latestFamilies);
  };

  if (isRestoringSession) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color="#0f766e" size="large" />
        <Text style={styles.loadingText}>Abriendo tu espacio familiar...</Text>
      </SafeAreaView>
    );
  }

  if (token && user) {
    return (
      <ProtectedScreen
        accessToken={token}
        families={families}
        hasShareIntent={hasShareIntent}
        onFamiliesChanged={refreshFamilies}
        invitationToken={pendingInvitationToken}
        onInvitationHandled={() => setPendingInvitationToken(null)}
        onLogout={logout}
        resetShareIntent={resetShareIntent}
        shareIntent={shareIntent}
        shareIntentError={shareIntentError}
        user={user}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.kicker}>Coparent Global</Text>
            <Text style={styles.title}>{authText.title}</Text>
            <Text style={styles.subtitle}>{authText.subtitle}</Text>
            <View style={styles.authValueGrid}>
              <Text style={styles.authValuePill}>{authText.valuePillOne}</Text>
              <Text style={styles.authValuePill}>{authText.valuePillTwo}</Text>
              <Text style={styles.authValuePill}>{authText.valuePillThree}</Text>
            </View>
            <View style={styles.authTopRow}>
              <Text style={styles.buildBadge}>{authText.trialBadge}</Text>
              <View style={styles.languageToggle}>
                <Pressable onPress={() => setAuthLanguage('es')} style={[styles.languageButton, authLanguage === 'es' ? styles.languageButtonActive : undefined]}>
                  <Text style={[styles.languageButtonText, authLanguage === 'es' ? styles.languageButtonTextActive : undefined]}>ES</Text>
                </Pressable>
                <Pressable onPress={() => setAuthLanguage('en')} style={[styles.languageButton, authLanguage === 'en' ? styles.languageButtonActive : undefined]}>
                  <Text style={[styles.languageButtonText, authLanguage === 'en' ? styles.languageButtonTextActive : undefined]}>EN</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.onboardingPanel}>
            <Text style={styles.cardLabel}>{authText.firstStepTitle}</Text>
            <Text style={styles.emptyText}>{authText.firstStepCopy}</Text>
            <View style={styles.onboardingActionGrid}>
              <Pressable onPress={() => setMode('register')} style={styles.onboardingPrimaryAction}>
                <Text style={styles.onboardingPrimaryText}>{authText.startFamily}</Text>
              </Pressable>
              <Pressable onPress={chooseInvitationFlow} style={styles.onboardingSecondaryAction}>
                <Text style={styles.onboardingSecondaryText}>{authText.receivedInvitation}</Text>
              </Pressable>
              <Pressable onPress={() => setMode('login')} style={styles.onboardingSecondaryAction}>
                <Text style={styles.onboardingSecondaryText}>{authText.login}</Text>
              </Pressable>
            </View>
            <Pressable onPress={chooseStandaloneFlow} style={styles.onboardingQuietAction}>
              <Text style={styles.onboardingQuietText}>{authText.useAlone}</Text>
            </Pressable>
            <Text style={styles.apiHint}>{authText.testingHelp}</Text>
          </View>

          <View style={styles.segmented}>
            <ModeButton label={authText.login} isActive={mode === 'login'} onPress={() => setMode('login')} />
            <ModeButton label={authText.register} isActive={mode === 'register'} onPress={() => setMode('register')} />
          </View>

          <View style={styles.form}>
            {mode === 'register' ? (
              <View style={styles.row}>
                <Field
                  label={authText.firstName}
                  value={form.firstName}
                  onChangeText={(value) => updateForm('firstName', value)}
                  autoCapitalize="words"
                />
                <Field
                  label={authText.lastName}
                  value={form.lastName}
                  onChangeText={(value) => updateForm('lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            ) : null}

            <Field
              label={authText.email}
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label={authText.password}
              value={form.password}
              onChangeText={(value) => updateForm('password', value)}
              secureTextEntry
              autoCapitalize="none"
            />

            {mode === 'register' ? (
              <Field
                label={authText.optionalPhone}
                value={form.phone}
                onChangeText={(value) => updateForm('phone', value)}
                keyboardType="phone-pad"
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={submit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressed : undefined,
                isLoading ? styles.disabled : undefined,
              ]}
            >
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{mode === 'login' ? authText.login : authText.createAccount}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={isLoading} onPress={submitGoogle} style={styles.googleButton}>
              <Text style={styles.googleButtonText}>{authText.continueGoogle}</Text>
            </Pressable>
            {mode === 'login' ? (
              <>
                <Pressable accessibilityRole="button" disabled={isLoading} onPress={forgotPassword} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>{authText.forgotPassword}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={isLoading} onPress={resendVerification} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>{authText.resendVerification}</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <Text style={styles.apiHint}>{authText.privacyNote}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.modeButton, isActive ? styles.modeButtonActive : undefined]}
    >
      <Text style={[styles.modeButtonText, isActive ? styles.modeButtonTextActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
} & Omit<React.ComponentProps<typeof TextInput>, 'style' | 'value' | 'onChangeText'>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8390a4"
        style={styles.input}
      />
    </View>
  );
}

function ProtectedScreen({
  accessToken,
  families,
  hasShareIntent,
  onFamiliesChanged,
  invitationToken,
  onInvitationHandled,
  resetShareIntent,
  shareIntent,
  shareIntentError,
  user,
  onLogout,
}: {
  accessToken: string;
  families: Family[];
  hasShareIntent: boolean;
  onFamiliesChanged: () => Promise<void>;
  invitationToken: string | null;
  onInvitationHandled: () => void;
  resetShareIntent: () => void;
  shareIntent: ShareIntent | null;
  shareIntentError: string | null;
  user: AuthenticatedUser;
  onLogout: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const primaryFamily = families[0];
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [childForm, setChildForm] = useState<ChildForm>(initialChildForm);
  const [birthDateParts, setBirthDateParts] = useState<BirthDateParts>(emptyBirthDateParts);
  const [birthDatePicker, setBirthDatePicker] = useState<BirthDatePart | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarChangeRequests, setCalendarChangeRequests] = useState<CalendarChangeRequest[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [changeRequestEventId, setChangeRequestEventId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [calendarForm, setCalendarForm] = useState<CalendarForm>(initialCalendarForm);
  const [calendarPicker, setCalendarPicker] = useState<CalendarPickerField | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(initialExpenseForm);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [expenseReport, setExpenseReport] = useState<ExpenseMonthlyReport | null>(null);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageCategory, setMessageCategory] = useState<FamilyMessage['category']>('LOGISTICS');
  const [messageReview, setMessageReview] = useState<MessageReview | null>(null);
  const [messageReviewContent, setMessageReviewContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyState | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<FamilySubscriptionState | null>(null);
  const [requestingPlan, setRequestingPlan] = useState<SubscriptionPlan | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('es');
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [whatsAppLinks, setWhatsAppLinks] = useState<WhatsAppLink[]>([]);
  const [whatsAppActions, setWhatsAppActions] = useState<WhatsAppPendingAction[]>([]);
  const [whatsAppCode, setWhatsAppCode] = useState<WhatsAppLinkCode | null>(null);
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const [processingWhatsAppActionId, setProcessingWhatsAppActionId] = useState<string | null>(null);
  const [isImportingShare, setIsImportingShare] = useState(false);
  const [sharedReceiptFiles, setSharedReceiptFiles] = useState<Record<string, SharedReceiptFile>>({});
  const [editingWhatsAppActionId, setEditingWhatsAppActionId] = useState<string | null>(null);
  const [whatsAppDraftText, setWhatsAppDraftText] = useState('');
  const [reviewingInvitationToken, setReviewingInvitationToken] = useState<string | null>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const {
    connected: billingConnected,
    subscriptions: playSubscriptions,
    fetchProducts: fetchPlaySubscriptions,
    requestPurchase: startPlayPurchase,
    finishTransaction: finishPlayTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (purchase.purchaseState === 'pending') {
        setRequestingPlan(null);
        Alert.alert(t('purchasePending'), t('purchasePendingCopy'));
        return;
      }
      if (!primaryFamily || !purchase.purchaseToken) return;
      try {
        const nextState = await verifyGooglePlayPurchase(accessToken, primaryFamily.id, {
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
        });
        await finishPlayTransaction({ purchase, isConsumable: false });
        setSubscriptionState(nextState);
        await cacheData('subscription', nextState);
        Alert.alert(t('purchaseVerified'), t('purchaseVerifiedCopy'));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t('purchasePendingCopy'));
      } finally {
        setRequestingPlan(null);
      }
    },
    onPurchaseError: (purchaseError) => {
      setRequestingPlan(null);
      if (!purchaseError.code?.includes('cancel')) setError(purchaseError.message);
    },
  });

  useEffect(() => {
    if (!invitationToken || reviewingInvitationToken === invitationToken) return;
    setReviewingInvitationToken(invitationToken);
    getFamilyInvitationPreview(invitationToken)
      .then((invitation) => {
        if (invitation.status !== 'PENDING') {
          Alert.alert('Invitacion no disponible', 'Este enlace ya fue utilizado, revocado o vencio.');
          onInvitationHandled();
          return;
        }
        Alert.alert(
          language === 'en' ? 'Accept family invitation' : 'Aceptar invitación familiar',
          language === 'en'
            ? `${invitation.inviter.firstName} ${invitation.inviter.lastName} invited you to ${invitation.familyName}.`
            : `${invitation.inviter.firstName} ${invitation.inviter.lastName} te invita a ${invitation.familyName}.`,
          [
            { text: language === 'en' ? 'Not now' : 'Ahora no', style: 'cancel', onPress: onInvitationHandled },
            {
              text: language === 'en' ? 'Accept' : 'Aceptar',
              onPress: async () => {
                try {
                  await acceptFamilyInvitation(accessToken, invitationToken);
                  await onFamiliesChanged();
                  Alert.alert('Invitacion aceptada', `Ya participas en ${invitation.familyName}.`);
                } catch (caught) {
        setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not accept the invitation.' : 'No pudimos aceptar la invitación.');
                } finally {
                  onInvitationHandled();
                }
              },
            },
          ],
        );
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not review the invitation.' : 'No pudimos revisar la invitación.');
        onInvitationHandled();
      });
  }, [accessToken, invitationToken, reviewingInvitationToken]);

  useEffect(() => {
    if (!primaryFamily) return;
    setCalendarForm((current) => ({
      ...current,
      childId: current.childId || primaryFamily.children[0]?.id || '',
      currentParentId: current.currentParentId || primaryFamily.members[0]?.user.id || '',
    }));
    setExpenseForm((current) => ({
      ...current,
      paidById: current.paidById || primaryFamily.members[0]?.user.id || '',
    }));
  }, [primaryFamily]);

  useEffect(() => {
    getExpoPushToken()
      .then((token) => {
        if (token && (Platform.OS === 'android' || Platform.OS === 'ios')) {
          return registerPushDevice(accessToken, token, Platform.OS);
        }
        return undefined;
      })
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    configureCrashReporting(privacy?.settings.allowProductAnalytics === true).catch(() => undefined);
  }, [privacy?.settings.allowProductAnalytics]);

  useEffect(() => {
    if (!billingConnected || !subscriptionState?.billing.googlePlayReady) return;
    const skus = subscriptionState.catalog.flatMap((plan) => plan.googlePlayProductId ? [plan.googlePlayProductId] : []);
    fetchPlaySubscriptions({ skus, type: 'subs' }).catch(() => undefined);
  }, [billingConnected, subscriptionState?.billing.googlePlayReady]);

  useEffect(() => {
    const loadOperationalData = async () => {
      try {
        const reportMonth = new Date().toISOString().slice(0, 7);
        const [events, requests, latestExpenses, latestMessages, privacyState, summary, report, subscription] = await Promise.all([
          getCalendarEvents(accessToken),
          getCalendarChangeRequests(accessToken),
          getExpenses(accessToken),
          primaryFamily ? getFamilyMessages(accessToken, primaryFamily.id) : Promise.resolve([]),
          getPrivacy(accessToken),
          primaryFamily ? getExpenseSummary(accessToken, primaryFamily.id) : Promise.resolve(null),
          primaryFamily ? getExpenseMonthlyReport(accessToken, primaryFamily.id, reportMonth) : Promise.resolve(null),
          primaryFamily ? getFamilySubscription(accessToken, primaryFamily.id) : Promise.resolve(null),
        ]);
        setCalendarEvents(events);
        setCalendarChangeRequests(requests);
        setExpenses(latestExpenses);
        setMessages(latestMessages);
        setPrivacy(privacyState);
        setExpenseSummary(summary);
        setExpenseReport(report);
        setSubscriptionState(subscription);
        setLanguage(privacyState.settings.preferredLocale.startsWith('en') ? 'en' : 'es');
        await Promise.all([
          cacheData('calendarEvents', events),
          cacheData('calendarChangeRequests', requests),
          cacheData('expenses', latestExpenses),
          cacheData('messages', latestMessages),
          cacheData('privacy', privacyState),
          cacheData('expenseSummary', summary),
          cacheData('expenseReport', report),
          cacheData('subscription', subscription),
        ]);
      } catch {
        const [events, requests, latestExpenses, latestMessages, privacyState, summary, report, subscription] = await Promise.all([
          getCachedData<CalendarEvent[]>('calendarEvents'),
          getCachedData<CalendarChangeRequest[]>('calendarChangeRequests'),
          getCachedData<Expense[]>('expenses'),
          getCachedData<FamilyMessage[]>('messages'),
          getCachedData<PrivacyState>('privacy'),
          getCachedData<ExpenseSummary>('expenseSummary'),
          getCachedData<ExpenseMonthlyReport>('expenseReport'),
          getCachedData<FamilySubscriptionState>('subscription'),
        ]);
        setCalendarEvents(events ?? []);
        setCalendarChangeRequests(requests ?? []);
        setExpenses(latestExpenses ?? []);
        setMessages(latestMessages ?? []);
        setPrivacy(privacyState);
        setExpenseSummary(summary);
        setExpenseReport(report);
        setSubscriptionState(subscription);
      }
    };
    loadOperationalData();
  }, [accessToken, primaryFamily?.id]);

  useEffect(() => {
    getQueuedMutations().then((queue) => setQueuedCount(queue.length));
    return NetInfo.addEventListener(async (state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(connected);
      if (connected) {
        const result = await flushQueuedMutations((mutation) => executeQueuedMutation(accessToken, mutation));
        setQueuedCount(result.remaining);
        if (result.synced > 0 && primaryFamily) {
          const latestMessages = await getFamilyMessages(accessToken, primaryFamily.id).catch(() => messages);
          setMessages(latestMessages);
          await cacheData('messages', latestMessages);
        }
      }
    });
  }, [accessToken, primaryFamily?.id]);

  useEffect(() => {
    if (!primaryFamily || (activeTab !== 'home' && activeTab !== 'settings')) return;
    Promise.all([getWhatsAppLinks(accessToken), getWhatsAppActions(accessToken)])
      .then(([links, actions]) => {
        setWhatsAppLinks(links);
        setWhatsAppActions(actions);
      })
      .catch(() => undefined);
  }, [accessToken, activeTab, primaryFamily?.id]);

  useEffect(() => {
    if (shareIntentError) setError(shareIntentError);
  }, [shareIntentError]);

  useEffect(() => {
    if (!hasShareIntent || !shareIntent || !primaryFamily || !isOnline || isImportingShare) return;
    const sharedFile = shareIntent.files?.find((file) => file.mimeType?.startsWith('image/'));
    const text = [shareIntent.text, shareIntent.webUrl]
      .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
      .join('\n')
      .trim();

    setIsImportingShare(true);
    createSharedWhatsAppAction(accessToken, {
      familyId: primaryFamily.id,
      text: text || undefined,
      hasImage: Boolean(sharedFile),
      fileName: sharedFile?.fileName,
      mimeType: sharedFile?.mimeType,
      fileSize: sharedFile?.size ?? undefined,
      fileCount: sharedFile ? shareIntent.files?.length : undefined,
    })
      .then((action) => {
        if (sharedFile) {
          setSharedReceiptFiles((current) => ({ ...current, [action.id]: sharedFile }));
        }
        resetShareIntent();
        setWhatsAppActions((current) => [action, ...current.filter((item) => item.id !== action.id)]);
        setActiveTab('settings');
        Alert.alert(t('shareDraftReady'), t('shareDraftReadyCopy'));
      })
      .catch((caught) => {
        resetShareIntent();
        setError(caught instanceof Error ? caught.message : t('shareDraftFailed'));
      })
      .finally(() => setIsImportingShare(false));
  }, [
    accessToken,
    hasShareIntent,
    isImportingShare,
    isOnline,
    primaryFamily?.id,
    resetShareIntent,
    shareIntent,
  ]);

  const updateChildForm = (field: keyof ChildForm, value: string) => {
    setChildForm((current) => ({ ...current, [field]: value }));
  };

  const resetChildForm = () => {
    setChildForm(initialChildForm);
    setBirthDateParts(emptyBirthDateParts);
  };

  const updateBirthDatePart = (part: BirthDatePart, value: string) => {
    setBirthDateParts((current) => {
      const next = { ...current, [part]: value };
      const maxDay = getDaysInMonth(next.year, next.month);
      if (next.day && Number(next.day) > maxDay) {
        next.day = String(maxDay).padStart(2, '0');
      }
      setChildForm((form) => ({ ...form, birthDate: buildBirthDate(next) }));
      return next;
    });
    setBirthDatePicker(null);
  };

  const submitFamily = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const tenant = await createTenant(accessToken, familyName.trim() || `Familia de ${user.firstName}`);
      await createFamily(accessToken, tenant.id);
      setFamilyName('');
      await onFamiliesChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos crear la familia.');
    } finally {
      setIsCreating(false);
    }
  };

  const submitChild = async () => {
    if (!primaryFamily) {
      return;
    }

    setError(null);

    const selectedBirthDate = buildBirthDate(birthDateParts);
    if (!selectedBirthDate) {
      setError('Elegí día, mes y año de nacimiento.');
      return;
    }

    setIsCreatingChild(true);

    try {
      const input = {
        firstName: childForm.firstName.trim(),
        lastName: childForm.lastName.trim(),
        birthDate: selectedBirthDate,
        observations: childForm.observations.trim() || undefined,
      };
      if (editingChildId) {
        await updateChild(accessToken, editingChildId, input);
      } else {
        await createChild(accessToken, { familyId: primaryFamily.id, ...input });
      }
      resetChildForm();
      setEditingChildId(null);
      await onFamiliesChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos agregar el hijo/a.');
    } finally {
      setIsCreatingChild(false);
    }
  };

  const startEditingChild = (child: Family['children'][number]) => {
    const birthDate = child.birthDate.slice(0, 10);
    setEditingChildId(child.id);
    setChildForm({
      firstName: child.firstName,
      lastName: child.lastName,
      birthDate,
      observations: child.observations ?? '',
    });
    setBirthDateParts(parseBirthDateParts(birthDate));
  };

  const confirmDeleteChild = (child: Family['children'][number]) => {
    Alert.alert(
      language === 'en' ? 'Delete child' : 'Eliminar hijo/a',
      language === 'en' ? `Delete ${child.firstName} ${child.lastName}?` : `¿Eliminar a ${child.firstName} ${child.lastName}?`,
      [
        { text: language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: language === 'en' ? 'Delete' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChild(accessToken, child.id);
              await onFamiliesChanged();
            } catch (caught) {
            setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not delete the child.' : 'No pudimos eliminar el hijo/a.');
            }
          },
        },
      ],
    );
  };

  const submitInvite = async () => {
    if (!primaryFamily) return;
    setError(null);
    setIsInviting(true);
    try {
      const invitation = await createFamilyInvitation(accessToken, primaryFamily.id, inviteEmail.trim() || undefined);
      await Share.share({
        title: 'Invitacion a Coparent Global',
        message: buildFamilyInvitationShareMessage(invitation.shareUrl, language),
        url: invitation.shareUrl,
      });
      setInviteEmail('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not create the invitation.' : 'No pudimos crear la invitación.');
    } finally {
      setIsInviting(false);
    }
  };

  const refreshCalendarData = async () => {
    const [events, requests] = await Promise.all([
      getCalendarEvents(accessToken),
      getCalendarChangeRequests(accessToken),
    ]);
    setCalendarEvents(events);
    setCalendarChangeRequests(requests);
    await Promise.all([cacheData('calendarEvents', events), cacheData('calendarChangeRequests', requests)]);
  };

  const refreshExpenseData = async () => {
    const reportMonth = new Date().toISOString().slice(0, 7);
    const [latestExpenses, summary, report] = await Promise.all([
      getExpenses(accessToken),
      primaryFamily ? getExpenseSummary(accessToken, primaryFamily.id) : Promise.resolve(null),
      primaryFamily ? getExpenseMonthlyReport(accessToken, primaryFamily.id, reportMonth) : Promise.resolve(null),
    ]);
    setExpenses(latestExpenses);
    setExpenseSummary(summary);
    setExpenseReport(report);
    await Promise.all([cacheData('expenses', latestExpenses), cacheData('expenseSummary', summary), cacheData('expenseReport', report)]);
  };

  const submitCalendarEvent = async () => {
    setError(null);
    if (!changeRequestEventId && !calendarForm.title.trim()) {
      setError('Completa el nombre del evento.');
      return;
    }
    if (!calendarForm.childId || !calendarForm.currentParentId) {
      setError('Seleccioná un hijo/a y un progenitor responsable.');
      return;
    }
    if (!calendarForm.startDate || !calendarForm.startTime || !calendarForm.endDate || !calendarForm.endTime) {
      setError('Seleccioná fecha y hora de inicio y fin.');
      return;
    }
    setIsCreatingEvent(true);
    try {
      const input = {
        currentParentId: calendarForm.currentParentId,
        title: calendarForm.title.trim(),
        type: calendarForm.type,
        location: calendarForm.location.trim() || undefined,
        notes: calendarForm.notes.trim() || undefined,
        startDate: new Date(`${calendarForm.startDate}T${calendarForm.startTime}`).toISOString(),
        endDate: new Date(`${calendarForm.endDate}T${calendarForm.endTime}`).toISOString(),
      };
      if (editingEventId) {
        await updateCalendarEvent(accessToken, editingEventId, input);
      } else {
        await createCalendarEvent(accessToken, { childId: calendarForm.childId, ...input });
      }
      await refreshCalendarData();
      setCalendarForm((current) => ({
        ...initialCalendarForm,
        childId: current.childId,
        currentParentId: current.currentParentId,
      }));
      setEditingEventId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos crear el evento.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const startEditingEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setChangeRequestEventId(null);
    setCalendarForm({
      title: event.title,
      type: event.type,
      childId: event.child.id,
      currentParentId: event.currentParent.id,
      startDate: toDateInputValue(event.startDate),
      startTime: toTimeInputValue(event.startDate),
      endDate: toDateInputValue(event.endDate),
      endTime: toTimeInputValue(event.endDate),
      location: event.location ?? '',
      notes: event.notes ?? '',
    });
  };

  const startChangeRequest = (event: CalendarEvent) => {
    setChangeRequestEventId(event.id);
    setEditingEventId(null);
    setCalendarForm({
      title: event.title,
      type: event.type,
      childId: event.child.id,
      currentParentId: event.currentParent.id,
      startDate: toDateInputValue(event.startDate),
      startTime: toTimeInputValue(event.startDate),
      endDate: toDateInputValue(event.endDate),
      endTime: toTimeInputValue(event.endDate),
      location: event.location ?? '',
      notes: event.notes ?? '',
    });
  };

  const submitChangeRequest = async () => {
    if (!changeRequestEventId) return;
    setError(null);
    try {
      await requestCalendarChange(accessToken, changeRequestEventId, {
        newStartDate: new Date(`${calendarForm.startDate}T${calendarForm.startTime}`).toISOString(),
        newEndDate: new Date(`${calendarForm.endDate}T${calendarForm.endTime}`).toISOString(),
        reason: changeReason.trim() || undefined,
      });
      setChangeRequestEventId(null);
      setChangeReason('');
      await refreshCalendarData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos enviar la solicitud.');
    }
  };

  const resolveChangeRequestAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await resolveCalendarChange(accessToken, requestId, status);
      await refreshCalendarData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos resolver la solicitud.');
    }
  };

  const confirmCancelEvent = (event: CalendarEvent) => {
    Alert.alert(language === 'en' ? 'Cancel event' : 'Cancelar evento', language === 'en' ? 'The event will remain recorded as cancelled.' : 'El evento quedará registrado como cancelado.', [
      { text: language === 'en' ? 'Back' : 'Volver', style: 'cancel' },
      {
        text: language === 'en' ? 'Cancel event' : 'Cancelar evento',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelCalendarEvent(accessToken, event.id);
            await refreshCalendarData();
          } catch (caught) {
          setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not cancel the event.' : 'No pudimos cancelar el evento.');
          }
        },
      },
    ]);
  };

  const canDirectlyEditEvent = (event: CalendarEvent) => {
    const mode = primaryFamily?.settings?.relationshipMode ?? 'COOPERATIVE';
    const ownerId = event.createdBy?.id ?? event.currentParent.id;
    return mode === 'COOPERATIVE' || ownerId === user.id;
  };

  const submitExpense = async () => {
    if (!primaryFamily) return;
    setError(null);
    const amount = Number(expenseForm.amount.replace(',', '.'));
    if (!expenseForm.description.trim() || !Number.isFinite(amount) || amount <= 0 || !expenseForm.paidById) {
      setError('Completa descripcion, importe y quien pago.');
      return;
    }
    setIsCreatingExpense(true);
    try {
      await createExpense(accessToken, {
        familyId: primaryFamily.id,
        paidById: expenseForm.paidById,
        description: expenseForm.description.trim(),
        category: expenseForm.category,
        amount,
        splitMode: expenseForm.splitMode,
        receiptReference: expenseForm.receiptReference.trim() || undefined,
      });
      await refreshExpenseData();
      setExpenseForm((current) => ({ ...current, description: '', amount: '', receiptReference: '' }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos registrar el gasto.');
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const payMyAllocation = async (allocationId: string) => {
    try {
      await markExpenseAllocationPaid(accessToken, allocationId);
      await refreshExpenseData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos marcar el pago.');
    }
  };

  const updateMyAllocation = async (allocationId: string, status: 'OBSERVED' | 'REJECTED') => {
    try {
      await updateExpenseAllocationStatus(accessToken, allocationId, status);
      await refreshExpenseData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos actualizar el reembolso.');
    }
  };

  const reviewMessage = async () => {
    if (!primaryFamily || !messageContent.trim()) return;
    const content = messageContent.trim();
    const localReview = reviewMessageLocally(content, language);
    if (localReview.needsReview || !isOnline) {
      setMessageReview(localReview);
      setMessageReviewContent(content);
      return;
    }
    try {
      setMessageReview(await reviewFamilyMessage(accessToken, primaryFamily.id, content, `${language}-${language === 'es' ? 'AR' : 'US'}`));
      setMessageReviewContent(content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos revisar el mensaje.');
    }
  };

  const submitMessage = async () => {
    if (!primaryFamily || !messageContent.trim()) return;
    setIsSendingMessage(true);
    setError(null);
    const content = messageContent.trim();
    const localReview = reviewMessageLocally(content, language);
    if (localReview.needsReview && (!messageReview || messageReviewContent !== content)) {
      setMessageReview(localReview);
      setMessageReviewContent(content);
      setError(t('reviewBeforeSend'));
      setIsSendingMessage(false);
      return;
    }
    if (isOnline && (!messageReview || messageReviewContent !== content)) {
      try {
        const review = await reviewFamilyMessage(accessToken, primaryFamily.id, content, `${language}-${language === 'es' ? 'AR' : 'US'}`);
        setMessageReview(review);
        setMessageReviewContent(content);
        if (review.needsReview) {
          setError(t('reviewBeforeSend'));
          setIsSendingMessage(false);
          return;
        }
      } catch {
        setMessageReview(localReview);
        setMessageReviewContent(content);
      }
    }
    const body = {
      content,
      category: messageCategory,
      clientMutationId: createMutationId(),
    };
    try {
      if (!isOnline) {
        await queueMutation({ path: `/families/${primaryFamily.id}/messages`, method: 'POST', body });
        setQueuedCount((current) => current + 1);
      } else {
        await createFamilyMessage(accessToken, primaryFamily.id, body);
        const latestMessages = await getFamilyMessages(accessToken, primaryFamily.id);
        setMessages(latestMessages);
        await cacheData('messages', latestMessages);
      }
      setMessageContent('');
      setMessageReview(null);
      setMessageReviewContent('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos enviar el mensaje.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const setRelationshipMode = async (relationshipMode: RelationshipMode) => {
    if (!primaryFamily) return;
    try {
      await updateFamilySettings(accessToken, primaryFamily.id, { relationshipMode });
      await onFamiliesChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos cambiar el modo.');
    }
  };

  const setAppLanguage = async (nextLanguage: SupportedLanguage) => {
    setLanguage(nextLanguage);
    try {
      await updatePrivacy(accessToken, { preferredLocale: nextLanguage === 'es' ? 'es-AR' : 'en-US' });
      setPrivacy(await getPrivacy(accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar el idioma.');
    }
  };

  const updatePrivacyOption = async (field: 'allowProductAnalytics' | 'allowAiProcessing', value: boolean) => {
    try {
      await updatePrivacy(accessToken, { [field]: value });
      setPrivacy(await getPrivacy(accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar la privacidad.');
    }
  };

  const validateCrashReporting = async () => {
    if (!privacy?.settings.allowProductAnalytics) {
      Alert.alert(t('productAnalytics'), t('diagnosticTestRequiresConsent'));
      return;
    }

    try {
      await sendCrashReportingTest();
      Alert.alert(t('diagnosticTestSent'), t('diagnosticTestSentCopy'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('diagnosticTestRequiresConsent'));
    }
  };

  const manageDeletionRequest = () => {
    const hasPending = Boolean(privacy?.deletionRequest);
    Alert.alert(
      hasPending
        ? (language === 'en' ? 'Cancel deletion request' : 'Cancelar eliminación')
        : (language === 'en' ? 'Request account deletion' : 'Solicitar eliminación'),
      hasPending
        ? (language === 'en' ? 'The account will remain active.' : 'La cuenta continuará activa.')
        : (language === 'en'
          ? 'The request will be reviewed before deleting shared data or records subject to retention.'
          : 'La solicitud será revisada antes de eliminar datos compartidos o sujetos a conservación.'),
      [
        { text: language === 'en' ? 'Back' : 'Volver', style: 'cancel' },
        {
          text: hasPending ? (language === 'en' ? 'Cancel request' : 'Cancelar solicitud') : (language === 'en' ? 'Request' : 'Solicitar'),
          style: hasPending ? 'default' : 'destructive',
          onPress: async () => {
            if (hasPending) await cancelAccountDeletion(accessToken);
            else await requestAccountDeletion(accessToken);
            setPrivacy(await getPrivacy(accessToken));
          },
        },
      ],
    );
  };

  const permanentlyDeleteAccount = () => {
    Alert.alert(
      language === 'en' ? 'Delete account permanently' : 'Eliminar cuenta definitivamente',
      language === 'en'
        ? 'Your session will be closed and your personal data will be anonymized. Shared family records may be retained without your personal data.'
        : 'Se cerrará tu sesión y tus datos personales serán anonimizados. Los registros familiares compartidos pueden conservarse sin tus datos personales.',
      [
        { text: language === 'en' ? 'Back' : 'Volver', style: 'cancel' },
        {
          text: language === 'en' ? 'Delete permanently' : 'Eliminar definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              await confirmAccountDeletion(accessToken);
              await onLogout();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : language === 'en' ? 'We could not delete the account.' : 'No pudimos eliminar la cuenta.');
            }
          },
        },
      ],
    );
  };

  const requestPlan = async (plan: SubscriptionPlan) => {
    if (!primaryFamily) return;
    if (currentFamilyMember?.role !== 'PRIMARY_PARENT') {
      Alert.alert(t('plansAndSubscription'), t('onlyPrimaryManagesPlan'));
      return;
    }
    setError(null);
    setRequestingPlan(plan);
    try {
      const nextState = await requestFamilyPlanChange(accessToken, primaryFamily.id, plan);
      setSubscriptionState(nextState);
      await cacheData('subscription', nextState);
      Alert.alert(t('planRequestSent'), t('planRequestSentCopy'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('planRequestSentCopy'));
    } finally {
      setRequestingPlan(null);
    }
  };

  const purchasePlan = async (plan: SubscriptionPlan, basePlanId: 'monthly' | 'annual') => {
    if (!primaryFamily) return;
    if (currentFamilyMember?.role !== 'PRIMARY_PARENT') {
      Alert.alert(t('plansAndSubscription'), t('onlyPrimaryManagesPlan'));
      return;
    }
    if (Platform.OS !== 'android' || !billingConnected) {
      Alert.alert(t('plansAndSubscription'), t('playStoreUnavailable'));
      return;
    }

    const productId = subscriptionState?.catalog.find((item) => item.plan === plan)?.googlePlayProductId;
    const product = playSubscriptions.find((item) => item.id === productId);
    const offer = product?.subscriptionOffers?.find(
      (item) => item.basePlanIdAndroid === basePlanId && item.offerTokenAndroid,
    );
    if (!productId || !offer?.offerTokenAndroid) {
      Alert.alert(t('plansAndSubscription'), t('playStoreUnavailable'));
      return;
    }

    setError(null);
    setRequestingPlan(plan);
    try {
      const purchases = await queryAvailablePurchases();
      const currentPurchase = purchases.find((purchase) =>
        subscriptionState?.catalog.some((item) => item.googlePlayProductId === purchase.productId),
      );
      const currentRank = subscriptionPlanRank(subscriptionState?.effectivePlan ?? 'BASIC');
      const nextRank = subscriptionPlanRank(plan);
      await startPlayPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken: offer.offerTokenAndroid }],
            obfuscatedAccountId: primaryFamily.id,
            obfuscatedProfileId: user.id,
            ...(currentPurchase?.purchaseToken && currentPurchase.productId !== productId
              ? {
                  purchaseToken: currentPurchase.purchaseToken,
                  replacementMode: nextRank >= currentRank ? 1 : 6,
                }
              : {}),
          },
        },
      });
    } catch (caught) {
      setRequestingPlan(null);
      setError(caught instanceof Error ? caught.message : t('playStoreUnavailable'));
    }
  };

  const restoreGooglePlayPurchases = async () => {
    if (!primaryFamily || Platform.OS !== 'android' || !billingConnected) {
      Alert.alert(t('plansAndSubscription'), t('playStoreUnavailable'));
      return;
    }
    setError(null);
    try {
      const purchases = await queryAvailablePurchases();
      let latestState: FamilySubscriptionState | null = null;
      for (const purchase of purchases) {
        if (!purchase.purchaseToken || purchase.purchaseState !== 'purchased') continue;
        if (!subscriptionState?.catalog.some((item) => item.googlePlayProductId === purchase.productId)) continue;
        latestState = await verifyGooglePlayPurchase(accessToken, primaryFamily.id, {
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken,
        });
      }
      if (!latestState) throw new Error(t('playStoreUnavailable'));
      setSubscriptionState(latestState);
      await cacheData('subscription', latestState);
      Alert.alert(t('purchaseVerified'), t('purchaseVerifiedCopy'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('playStoreUnavailable'));
    }
  };

  const manageGooglePlaySubscription = () => {
    const productId = subscriptionState?.subscription.googlePlayProductId;
    const suffix = productId ? `?sku=${encodeURIComponent(productId)}&package=ar.coparent.app` : '';
    Linking.openURL(`https://play.google.com/store/account/subscriptions${suffix}`);
  };

  const refreshWhatsApp = async () => {
    const [links, actions] = await Promise.all([
      getWhatsAppLinks(accessToken),
      getWhatsAppActions(accessToken),
    ]);
    setWhatsAppLinks(links);
    setWhatsAppActions(actions);
  };

  const generateWhatsAppCode = async () => {
    if (!primaryFamily) return;
    setError(null);
    setIsWhatsAppLoading(true);
    try {
      setWhatsAppCode(await createWhatsAppLinkCode(accessToken, primaryFamily.id));
      await refreshWhatsApp();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos generar el código de WhatsApp.');
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  const openWhatsApp = async () => {
    if (!whatsAppCode) return;
    const message = buildWhatsAppLinkMessage(whatsAppCode.code, language);
    try {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    } catch {
      Alert.alert('WhatsApp no disponible', 'Instala WhatsApp o envía el mensaje manualmente.');
    }
  };

  const startEditingWhatsAppAction = (action: WhatsAppPendingAction) => {
    setWhatsAppDraftText(action.originalText ?? describeWhatsAppAction(action, t));
    setEditingWhatsAppActionId(action.id);
  };

  const saveWhatsAppDraft = async () => {
    if (!editingWhatsAppActionId) return;
    setError(null);
    setProcessingWhatsAppActionId(editingWhatsAppActionId);
    try {
      const updated = await updateWhatsAppAction(accessToken, editingWhatsAppActionId, whatsAppDraftText);
      setWhatsAppActions((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingWhatsAppActionId(null);
      setWhatsAppDraftText('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('shareDraftFailed'));
    } finally {
      setProcessingWhatsAppActionId(null);
    }
  };

  const processWhatsAppAction = async (actionId: string, decision: 'confirm' | 'cancel') => {
    setError(null);
    setProcessingWhatsAppActionId(actionId);
    try {
      if (decision === 'confirm') {
        const confirmed = await confirmWhatsAppAction(accessToken, actionId);
        const receiptFile = sharedReceiptFiles[actionId];
        if (confirmed.type === 'EXPENSE' && confirmed.resultEntityId && receiptFile) {
          if ((receiptFile.size ?? 0) > 2_000_000) {
            Alert.alert(t('privateReceiptTooLarge'));
          } else {
            const dataBase64 = await FileSystem.readAsStringAsync(receiptFile.path, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await uploadExpenseReceipt(accessToken, confirmed.resultEntityId, {
              dataBase64,
              mimeType: receiptFile.mimeType,
              fileName: receiptFile.fileName,
            });
            Alert.alert(t('privateReceiptStored'));
          }
          setSharedReceiptFiles((current) => {
            const next = { ...current };
            delete next[actionId];
            return next;
          });
        }
      } else {
        await cancelWhatsAppAction(accessToken, actionId);
        setSharedReceiptFiles((current) => {
          const next = { ...current };
          delete next[actionId];
          return next;
        });
      }
      const [events, latestExpenses] = await Promise.all([
        getCalendarEvents(accessToken),
        getExpenses(accessToken),
        onFamiliesChanged(),
        refreshWhatsApp(),
      ]);
      setCalendarEvents(events);
      setExpenses(latestExpenses);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos procesar la acción.');
    } finally {
      setProcessingWhatsAppActionId(null);
    }
  };

  const shareVerifiedArchive = async () => {
    if (!primaryFamily) return;
    try {
      const archive = await exportFamilyArchive(accessToken, primaryFamily.id);
      await Share.share({
        title: t('exportFamilyArchive'),
        message: JSON.stringify(archive, null, 2),
      });
      Alert.alert(t('exportReady'), archive.manifest.digest);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('exportFamilyArchiveCopy'));
    }
  };

  const shareBasicFamilySummary = async () => {
    if (!primaryFamily) return;

    const currency = expenseSummary?.currency ?? primaryFamily.settings?.currency ?? 'ARS';
    const nextEvents = calendarEvents
      .filter((event) => event.status !== 'CANCELLED')
      .slice(0, 5)
      .map((event) => `- ${event.title} | ${event.child.firstName} | ${formatDateTime(event.startDate)}`)
      .join('\n') || (language === 'en' ? '- No upcoming events' : '- Sin eventos próximos');
    const latestMessages = messages
      .slice(0, 5)
      .map((message) => `- ${message.sender.firstName}: ${message.content}`)
      .join('\n') || (language === 'en' ? '- No family messages' : '- Sin mensajes familiares');
    const latestExpenses = expenses
      .slice(0, 5)
      .map((expense) => `- ${expense.description}: ${formatCurrency(Number(expense.amount), currency)} (${expense.payer.firstName})`)
      .join('\n') || (language === 'en' ? '- No recorded expenses' : '- Sin gastos registrados');

    const message = language === 'en'
      ? [
          'Coparent Global - basic family summary',
          '',
          `Family: ${primaryFamily.tenant.name}`,
          `Members: ${primaryFamily.members.length}`,
          `Children: ${primaryFamily.children.map((child) => child.firstName).join(', ') || 'None'}`,
          `Outstanding balance: ${formatCurrency(expenseSummary?.totalOutstanding ?? 0, currency)}`,
          '',
          'Upcoming events:',
          nextEvents,
          '',
          'Latest messages:',
          latestMessages,
          '',
          'Latest expenses:',
          latestExpenses,
          '',
          'This is a basic operational summary. It is not a legal certificate or a verifiable audit export.',
        ].join('\n')
      : [
          'Coparent Global - resumen familiar básico',
          '',
          `Familia: ${primaryFamily.tenant.name}`,
          `Integrantes: ${primaryFamily.members.length}`,
          `Hijos/as: ${primaryFamily.children.map((child) => child.firstName).join(', ') || 'Ninguno'}`,
          `Saldo pendiente: ${formatCurrency(expenseSummary?.totalOutstanding ?? 0, currency)}`,
          '',
          'Próximos eventos:',
          nextEvents,
          '',
          'Últimos mensajes:',
          latestMessages,
          '',
          'Últimos gastos:',
          latestExpenses,
          '',
          'Este es un resumen operativo básico. No es una constancia legal ni una exportación verificable.',
        ].join('\n');

    await Share.share({ title: t('basicExport'), message });
    Alert.alert(t('basicExportReady'), t('basicExportCopy'));
  };

  const shareBasicFamilyHtmlExport = async () => {
    if (!primaryFamily) return;

    try {
      const exportFile = await exportBasicFamilyHtml(accessToken, primaryFamily.id, language);
      const fileUri = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}${exportFile.fileName}` : null;
      if (fileUri) {
        await FileSystem.writeAsStringAsync(fileUri, exportFile.html, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      await Share.share({
        title: t('basicExport'),
        message: `${exportFile.text}\n\nSHA-256: ${exportFile.manifest.digest}`,
        ...(fileUri ? { url: fileUri } : {}),
      });
      Alert.alert(t('basicExportReady'), `${exportFile.manifest.notice}\n\nSHA-256: ${exportFile.manifest.digest}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('basicExportCopy'));
    }
  };

  const birthDateOptions = birthDatePicker ? getBirthDateOptions(birthDatePicker, birthDateParts, language) : [];
  const calendarPickerOptions = calendarPicker ? getCalendarPickerOptions(calendarPicker, language) : [];
  const pendingWhatsAppActions = whatsAppActions.filter((action) => action.status === 'PENDING');
  const pendingChangeRequests = calendarChangeRequests.filter((request) => request.status === 'PENDING');
  const upcomingEvent = calendarEvents
    .filter((event) => event.status !== 'CANCELLED' && new Date(event.endDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  const currentFamilyMember = primaryFamily?.members.find((member) => member.user.id === user.id);
  const currentMessageContent = messageContent.trim();
  const liveToneReview = currentMessageContent ? reviewMessageLocally(currentMessageContent, language) : null;
  const displayedMessageReview = messageReviewContent === currentMessageContent ? messageReview : null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.protectedContainer} keyboardShouldPersistTaps="handled">
        {!isOnline ? (
          <View style={styles.offlineNotice}>
            <WifiOff color="#92400e" size={18} />
            <Text style={styles.offlineText}>{t('offline')} {queuedCount ? `(${queuedCount})` : ''}</Text>
          </View>
        ) : null}
        {activeTab === 'home' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('sessionActive')}</Text>
              <Text style={styles.title}>{t('homeGreeting')}, {user.firstName}</Text>
              <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
            </View>

            {primaryFamily ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('familySummary')}</Text>
                  <Text style={styles.cardValue}>{primaryFamily.tenant.name}</Text>
                  <View style={styles.statGrid}>
                    <View style={styles.statTile}>
                      <Text style={styles.statValue}>{primaryFamily.members.length}</Text>
                      <Text style={styles.statLabel}>{t('members')}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <Text style={styles.statValue}>{primaryFamily.children.length}</Text>
                      <Text style={styles.statLabel}>{t('children')}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <Text style={styles.statValue}>{formatCurrency(expenseSummary?.totalOutstanding ?? 0, expenseSummary?.currency ?? primaryFamily.settings?.currency ?? 'ARS')}</Text>
                      <Text style={styles.statLabel}>{t('pendingExpenses')}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <Text style={styles.statValue}>{pendingWhatsAppActions.length + pendingChangeRequests.length}</Text>
                      <Text style={styles.statLabel}>{t('pendingApprovals')}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('nextEvent')}</Text>
                  {upcomingEvent ? (
                    <View style={styles.dashboardItem}>
                      <Text style={styles.childName}>{upcomingEvent.title}</Text>
                      <Text style={styles.roleText}>{calendarEventTypeLabel(upcomingEvent.type, language)}</Text>
                      <Text style={styles.childDate}>{upcomingEvent.child.firstName} - {language === 'en' ? 'responsible' : 'responsable'}: {upcomingEvent.currentParent.firstName}</Text>
                      <Text style={styles.childDate}>{formatDateTime(upcomingEvent.startDate)} - {formatDateTime(upcomingEvent.endDate)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>{t('noUpcomingEvents')}</Text>
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('quickActions')}</Text>
                  <View style={styles.quickActionGrid}>
                    <Pressable onPress={() => setActiveTab('calendar')} style={styles.quickActionButton}>
                      <CalendarDays color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('calendar')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('expenses')} style={styles.quickActionButton}>
                      <ReceiptText color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('expenses')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('settings')} style={styles.quickActionButton}>
                      <Settings color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('manageFamily')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('settings')} style={styles.quickActionButton}>
                      <MessageCircle color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('reviewWhatsApp')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('privacy')} style={styles.quickActionButton}>
                      <ShieldCheck color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('privacy')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('exports')} style={styles.quickActionButton}>
                      <ReceiptText color="#0f766e" size={18} />
                      <Text style={styles.quickActionText}>{t('basicExport')}</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('children')}</Text>
                  {primaryFamily.children.length > 0 ? (
                    <View style={styles.childrenList}>
                      {primaryFamily.children.map((child) => (
                        <View key={child.id} style={styles.childItem}>
                          <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
                          <Text style={styles.childDate}>{formatDate(child.birthDate)}</Text>
                          <View style={styles.actionRow}>
                            <Pressable onPress={() => { startEditingChild(child); setActiveTab('settings'); }} style={styles.smallButton}>
                              <Text style={styles.smallButtonText}>{language === 'en' ? 'Edit' : 'Editar'}</Text>
                            </Pressable>
                            <Pressable onPress={() => confirmDeleteChild(child)} style={styles.dangerButton}>
                              <Text style={styles.dangerButtonText}>{language === 'en' ? 'Delete' : 'Eliminar'}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>{language === 'en' ? 'No children added yet.' : 'Todavía no cargaste hijos/as.'}</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('myFamily')}</Text>
                <Text style={styles.emptyTitle}>{t('createFirstFamily')}</Text>
                <Text style={styles.emptyText}>{t('createFamilyCopy')}</Text>
                <Field
                  label={t('familyName')}
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoCapitalize="words"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={isCreating}
                  onPress={submitFamily}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed ? styles.pressed : undefined,
                    isCreating ? styles.disabled : undefined,
                  ]}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('createFamily')}</Text>
                  )}
                </Pressable>
              </View>
            )}

          </>
        ) : null}

        {activeTab === 'calendar' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{language === 'en' ? 'Family organization' : 'Organización familiar'}</Text>
              <Text style={styles.title}>{t('calendar')}</Text>
              <Text style={styles.subtitle}>{language === 'en' ? 'Record who is responsible for each child and when.' : 'Registrá quién estará a cargo de cada hijo/a y cuándo.'}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{language === 'en' ? 'Upcoming events' : 'Próximos eventos'}</Text>
              {calendarEvents.length ? calendarEvents.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.childName}>{event.title}</Text>
                  <Text style={styles.roleText}>{calendarEventTypeLabel(event.type, language)}</Text>
                  <Text style={styles.childDate}>{event.child.firstName} - {language === 'en' ? 'responsible' : 'responsable'}: {event.currentParent.firstName}</Text>
                  <Text style={styles.childDate}>{formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}</Text>
                  {event.location ? <Text style={styles.childDate}>{event.location}</Text> : null}
                  <Text style={event.status === 'CANCELLED' ? styles.cancelledText : styles.roleText}>{calendarEventStatusLabel(event.status, language)}</Text>
                  {event.status !== 'CANCELLED' ? (
                    <View style={styles.actionRow}>
                      {canDirectlyEditEvent(event) ? (
                        <>
                          <Pressable onPress={() => startEditingEvent(event)} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>{language === 'en' ? 'Edit' : 'Editar'}</Text>
                          </Pressable>
                          <Pressable onPress={() => confirmCancelEvent(event)} style={styles.dangerButton}>
                            <Text style={styles.dangerButtonText}>{language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable onPress={() => startChangeRequest(event)} style={styles.smallButton}>
                          <Text style={styles.smallButtonText}>{language === 'en' ? 'Request change' : 'Solicitar cambio'}</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : null}
                </View>
              )) : <Text style={styles.emptyText}>{language === 'en' ? 'There are no events yet.' : 'Todavía no hay eventos cargados.'}</Text>}
            </View>
            {calendarChangeRequests.filter((request) => request.status === 'PENDING').length ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{language === 'en' ? 'Pending requests' : 'Solicitudes pendientes'}</Text>
                {calendarChangeRequests.filter((request) => request.status === 'PENDING').map((request) => (
                  <View key={request.id} style={styles.eventItem}>
                    <Text style={styles.childName}>{request.reason || (language === 'en' ? 'Schedule change requested' : 'Cambio de horario solicitado')}</Text>
                    <Text style={styles.childDate}>{formatDateTime(request.newStartDate)} - {formatDateTime(request.newEndDate)}</Text>
                    {request.requestedById !== user.id && request.calendarEvent && canDirectlyEditEvent(request.calendarEvent) ? (
                      <View style={styles.actionRow}>
                        <Pressable onPress={() => resolveChangeRequestAction(request.id, 'ACCEPTED')} style={styles.smallButton}>
                          <Text style={styles.smallButtonText}>{language === 'en' ? 'Accept' : 'Aceptar'}</Text>
                        </Pressable>
                        <Pressable onPress={() => resolveChangeRequestAction(request.id, 'REJECTED')} style={styles.dangerButton}>
                          <Text style={styles.dangerButtonText}>{language === 'en' ? 'Reject' : 'Rechazar'}</Text>
                        </Pressable>
                      </View>
                    ) : <Text style={styles.pendingText}>{language === 'en' ? 'Waiting for response' : 'Esperando respuesta'}</Text>}
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{changeRequestEventId ? (language === 'en' ? 'Change request' : 'Solicitud de cambio') : editingEventId ? (language === 'en' ? 'Edit event' : 'Editar evento') : (language === 'en' ? 'New event' : 'Nuevo evento')}</Text>
              <Text style={styles.emptyTitle}>{changeRequestEventId ? (language === 'en' ? 'Propose a new time' : 'Proponer nuevo horario') : (language === 'en' ? 'Organize activity' : 'Organizar actividad')}</Text>
              {!changeRequestEventId ? (
                <>
                  <Field label={language === 'en' ? 'Event name' : 'Nombre del evento'} value={calendarForm.title} onChangeText={(value) => setCalendarForm((current) => ({ ...current, title: value }))} placeholder={language === 'en' ? 'Example: Pediatric appointment' : 'Ej: Consulta con pediatra'} />
                  <Text style={styles.label}>{language === 'en' ? 'Event type' : 'Tipo de evento'}</Text>
                  <View style={styles.choiceRow}>
                    {calendarEventTypes.map((type) => (
                      <ChoiceButton
                        key={type.value}
                        label={language === 'en' ? type.en : type.es}
                        active={calendarForm.type === type.value}
                        onPress={() => setCalendarForm((current) => ({ ...current, type: type.value }))}
                      />
                    ))}
                  </View>
                </>
              ) : null}
              <Text style={styles.label}>{language === 'en' ? 'Child' : 'Hijo/a'}</Text>
              <View style={styles.choiceRow}>
                {primaryFamily?.children.map((child) => (
                  <ChoiceButton
                    key={child.id}
                    label={child.firstName}
                    active={calendarForm.childId === child.id}
                    onPress={() => setCalendarForm((current) => ({ ...current, childId: child.id }))}
                  />
                ))}
              </View>
              <Text style={styles.label}>{language === 'en' ? 'Responsible parent' : 'Progenitor responsable'}</Text>
              <View style={styles.choiceRow}>
                {primaryFamily?.members.map((member) => (
                  <ChoiceButton
                    key={member.id}
                    label={member.user.firstName}
                    active={calendarForm.currentParentId === member.user.id}
                    onPress={() => setCalendarForm((current) => ({ ...current, currentParentId: member.user.id }))}
                  />
                ))}
              </View>
              <Text style={styles.label}>{language === 'en' ? 'Start' : 'Inicio'}</Text>
              <View style={styles.dateSelectRow}>
                <DateSelect label={language === 'en' ? 'Date' : 'Fecha'} value={calendarForm.startDate} placeholder={language === 'en' ? 'Choose date' : 'Elegir fecha'} onPress={() => setCalendarPicker('startDate')} />
                <DateSelect label={language === 'en' ? 'Time' : 'Hora'} value={calendarForm.startTime} placeholder={language === 'en' ? 'Choose time' : 'Elegir hora'} onPress={() => setCalendarPicker('startTime')} />
              </View>
              <Text style={styles.label}>{language === 'en' ? 'End' : 'Fin'}</Text>
              <View style={styles.dateSelectRow}>
                <DateSelect label={language === 'en' ? 'Date' : 'Fecha'} value={calendarForm.endDate} placeholder={language === 'en' ? 'Choose date' : 'Elegir fecha'} onPress={() => setCalendarPicker('endDate')} />
                <DateSelect label={language === 'en' ? 'Time' : 'Hora'} value={calendarForm.endTime} placeholder={language === 'en' ? 'Choose time' : 'Elegir hora'} onPress={() => setCalendarPicker('endTime')} />
              </View>
              {!changeRequestEventId ? (
                <>
                  <Field label={language === 'en' ? 'Optional location' : 'Ubicación opcional'} value={calendarForm.location} onChangeText={(value) => setCalendarForm((current) => ({ ...current, location: value }))} />
                  <Field label={language === 'en' ? 'Optional notes' : 'Notas opcionales'} value={calendarForm.notes} onChangeText={(value) => setCalendarForm((current) => ({ ...current, notes: value }))} multiline />
                </>
              ) : null}
              {changeRequestEventId ? (
                <Field label={language === 'en' ? 'Optional reason' : 'Motivo opcional'} value={changeReason} onChangeText={setChangeReason} multiline />
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable disabled={isCreatingEvent} onPress={changeRequestEventId ? submitChangeRequest : submitCalendarEvent} style={[styles.primaryButton, isCreatingEvent ? styles.disabled : undefined]}>
                {isCreatingEvent ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{changeRequestEventId ? (language === 'en' ? 'Send request' : 'Enviar solicitud') : editingEventId ? (language === 'en' ? 'Save event' : 'Guardar evento') : (language === 'en' ? 'Create event' : 'Crear evento')}</Text>}
              </Pressable>
              {editingEventId || changeRequestEventId ? (
                <Pressable onPress={() => { setEditingEventId(null); setChangeRequestEventId(null); setChangeReason(''); }} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Back to new event' : 'Volver a nuevo evento'}</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        {activeTab === 'messages' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('familyCommunication')}</Text>
              <Text style={styles.title}>{t('messages')}</Text>
              <Text style={styles.subtitle}>{t('messageHistoryNotice')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('conversation')}</Text>
              {messages.length ? messages.map((message) => (
                <View key={message.id} style={[styles.messageItem, message.senderId === user.id ? styles.ownMessage : undefined]}>
                  <View style={styles.messageHeading}>
                    <Text style={styles.roleText}>{message.sender.firstName} - {messageCategoryLabel(message.category, t)}</Text>
                    <Text style={styles.childDate}>{formatDateTime(message.createdAt)}</Text>
                  </View>
                  <Text style={styles.messageText}>{message.content}</Text>
                  <Text style={styles.readText}>{t('seenBy')} {message.reads.length}</Text>
                </View>
              )) : <Text style={styles.emptyText}>{t('noFamilyMessages')}</Text>}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('newMessage')}</Text>
              <View style={styles.choiceRow}>
                {(['LOGISTICS', 'HEALTH', 'SCHOOL', 'EXPENSES', 'URGENT'] as const).map((category) => (
                  <ChoiceButton key={category} label={messageCategoryLabel(category, t)} active={messageCategory === category} onPress={() => setMessageCategory(category)} />
                ))}
              </View>
              <Field label={t('message')} value={messageContent} onChangeText={(value) => { setMessageContent(value); setMessageReview(null); setMessageReviewContent(''); }} multiline />
              {displayedMessageReview?.needsReview ? (
                <View style={[styles.assistantNotice, styles.assistantNoticeWarning]}>
                  <Text style={styles.assistantTitle}>{t('conflictSuggestion')}</Text>
                  <Text style={styles.assistantReason}>{t('reviewBeforeSend')}</Text>
                  {displayedMessageReview.reasons.map((reason) => <Text key={reason} style={styles.assistantReason}>{reason}</Text>)}
                  <Text style={styles.messageText}>{displayedMessageReview.suggestion}</Text>
                  <Pressable onPress={() => setMessageContent(displayedMessageReview.suggestion ?? messageContent)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>{t('useSuggestion')}</Text>
                  </Pressable>
                </View>
              ) : liveToneReview?.needsReview ? (
                <View style={[styles.assistantNotice, styles.assistantNoticeWarning]}>
                  <Text style={styles.assistantTitle}>{t('conflictSuggestion')}</Text>
                  <Text style={styles.assistantReason}>{t('reviewBeforeSend')}</Text>
                  {liveToneReview.reasons.map((reason) => <Text key={reason} style={styles.assistantReason}>{reason}</Text>)}
                  <Text style={styles.messageText}>{liveToneReview.suggestion}</Text>
                  <Pressable onPress={() => setMessageContent(liveToneReview.suggestion ?? messageContent)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>{t('useSuggestion')}</Text>
                  </Pressable>
                </View>
              ) : displayedMessageReview ? <Text style={styles.connectedText}>{t('clearNeutralMessage')}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actionRow}>
                <Pressable disabled={!messageContent.trim()} onPress={reviewMessage} style={styles.secondaryCompactButton}>
                  <ShieldCheck color="#0f766e" size={18} />
                  <Text style={styles.secondaryCompactText}>{t('review')}</Text>
                </Pressable>
                <Pressable disabled={isSendingMessage || !messageContent.trim()} onPress={submitMessage} style={styles.primaryCompactButton}>
                  {isSendingMessage ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{isOnline ? t('send') : t('saveToSend')}</Text>}
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        {activeTab === 'expenses' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('familyEconomy')}</Text>
              <Text style={styles.title}>{t('expenses')}</Text>
              <Text style={styles.subtitle}>{t('expenseSubtitle')}</Text>
            </View>
            {expenseReport ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('monthlyAnalysis')} - {expenseReport.month}</Text>
                <Text style={styles.emptyTitle}>{formatCurrency(expenseReport.total, expenseReport.currency)}</Text>
                <Text style={styles.emptyText}>
                  {expenseReport.changePercentage === null
                    ? t('noPreviousMonthExpenses')
                    : `${expenseReport.changePercentage >= 0 ? '+' : ''}${expenseReport.changePercentage}% ${t('comparedWithPreviousMonth')}`}
                </Text>
                <View style={styles.statGrid}>
                  <View style={styles.statTile}>
                    <Text style={styles.statValue}>{formatCurrency(expenseReport.sharedTotal, expenseReport.currency)}</Text>
                    <Text style={styles.statLabel}>{t('shared')}</Text>
                  </View>
                  <View style={styles.statTile}>
                    <Text style={styles.statValue}>{formatCurrency(expenseReport.individualTotal, expenseReport.currency)}</Text>
                    <Text style={styles.statLabel}>{t('paidByOneParty')}</Text>
                  </View>
                  <View style={styles.statTile}>
                    <Text style={styles.statValue}>{formatCurrency(expenseReport.outstandingTotal, expenseReport.currency)}</Text>
                    <Text style={styles.statLabel}>{t('reimbursementPending')}</Text>
                  </View>
                </View>
                <Text style={styles.label}>{t('byCategory')}</Text>
                {expenseReport.byCategory.map((category) => (
                  <View key={category.category} style={styles.reportRow}>
                    <Text style={styles.childName}>{expenseCategoryLabel(category.category, t)}</Text>
                    <Text style={styles.childDate}>{formatCurrency(category.total, expenseReport.currency)} - {category.percentage}%</Text>
                  </View>
                ))}
                <Text style={styles.label}>{t('paidByPerson')}</Text>
                {expenseReport.byPayer.map((payer) => (
                  <View key={payer.user.id} style={styles.reportRow}>
                    <Text style={styles.childName}>{payer.user.firstName} {payer.user.lastName}</Text>
                    <Text style={styles.childDate}>{formatCurrency(payer.total, expenseReport.currency)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {expenseSummary ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('balanceSummary')} · {expenseSummary.currency}</Text>
                <Text style={styles.emptyTitle}>{formatCurrency(expenseSummary.totalOutstanding, expenseSummary.currency)} {t('outstanding')}</Text>
                {expenseSummary.balances.map((balance) => (
                  <View key={balance.user.id} style={styles.balanceRow}>
                    <Text style={styles.childName}>{balance.user.firstName}</Text>
                    <View style={styles.balanceValues}>
                      <Text style={styles.childDate}>{t('owes')} {formatCurrency(balance.owes, expenseSummary.currency)}</Text>
                      <Text style={balance.net >= 0 ? styles.paidText : styles.pendingText}>{t('net')} {formatCurrency(balance.net, expenseSummary.currency)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('newExpense')}</Text>
              <Field label={t('description')} value={expenseForm.description} onChangeText={(value) => setExpenseForm((current) => ({ ...current, description: value }))} placeholder={t('schoolFeeExample')} />
              <Field label={`${t('amount')} ${primaryFamily?.settings?.currency ?? 'ARS'}`} value={expenseForm.amount} onChangeText={(value) => setExpenseForm((current) => ({ ...current, amount: value }))} keyboardType="decimal-pad" placeholder="0,00" />
              <Field label={t('optionalReceipt')} value={expenseForm.receiptReference} onChangeText={(value) => setExpenseForm((current) => ({ ...current, receiptReference: value }))} placeholder={t('receiptReferencePlaceholder')} />
              <Text style={styles.label}>{t('category')}</Text>
              <View style={styles.choiceRow}>
                {expenseCategories.map((category) => (
                  <ChoiceButton key={category.value} label={t(category.key)} active={expenseForm.category === category.value} onPress={() => setExpenseForm((current) => ({ ...current, category: category.value }))} />
                ))}
              </View>
              <Text style={styles.label}>{t('whoPaid')}</Text>
              <View style={styles.choiceRow}>
                {primaryFamily?.members.map((member) => (
                  <ChoiceButton key={member.id} label={member.user.firstName} active={expenseForm.paidById === member.user.id} onPress={() => setExpenseForm((current) => ({ ...current, paidById: member.user.id }))} />
                ))}
              </View>
              <Text style={styles.label}>{t('expenseType')}</Text>
              <View style={styles.choiceRow}>
                <ChoiceButton
                  label={t('splitBetweenParties')}
                  active={expenseForm.splitMode === 'SHARED'}
                  onPress={() => setExpenseForm((current) => ({ ...current, splitMode: 'SHARED' }))}
                />
                <ChoiceButton
                  label={t('onePartyPaid')}
                  active={expenseForm.splitMode === 'SINGLE_PAYER'}
                  onPress={() => setExpenseForm((current) => ({ ...current, splitMode: 'SINGLE_PAYER' }))}
                />
              </View>
              <Text style={styles.emptyText}>
                {expenseForm.splitMode === 'SHARED'
                  ? t('sharedExpenseCopy')
                  : t('singleExpenseCopy')}
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable disabled={isCreatingExpense} onPress={submitExpense} style={[styles.primaryButton, isCreatingExpense ? styles.disabled : undefined]}>
                {isCreatingExpense ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {expenseForm.splitMode === 'SHARED' ? t('registerAndSplit') : t('registerPayment')}
                  </Text>
                )}
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('history')}</Text>
              {expenses.length ? expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseHeading}>
                    <View style={styles.expenseDescription}>
                      <Text style={styles.childName}>{expense.description}</Text>
                      {expense.storageKey ? <Text style={styles.receiptText}>{t('receipt')}: {expense.storageProvider === 'DATABASE_PRIVATE' ? t('privateReceiptStored') : expense.storageKey}</Text> : null}
                      <Text style={styles.childDate}>{t('paidBy')} {expense.payer.firstName} · {formatDate(expense.createdAt)}</Text>
                    </View>
                    <Text style={styles.amountText}>{formatCurrency(Number(expense.amount), primaryFamily?.settings?.currency ?? 'ARS')}</Text>
                  </View>
                  {expense.allocations.map((allocation) => (
                    <View key={allocation.id} style={styles.allocationRow}>
                      <Text style={styles.allocationText}>{allocation.user.firstName}: {formatCurrency(Number(allocation.amountDue), primaryFamily?.settings?.currency ?? 'ARS')}</Text>
                      {allocation.status === 'PAID' ? (
                        <Text style={styles.paidText}>{t('paid')}</Text>
                      ) : allocation.userId === user.id ? (
                        <View style={styles.actionRow}>
                          <Pressable onPress={() => payMyAllocation(allocation.id)} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>{t('pay')}</Text>
                          </Pressable>
                          <Pressable onPress={() => updateMyAllocation(allocation.id, 'OBSERVED')} style={styles.dangerButton}>
                            <Text style={styles.dangerButtonText}>{t('observe')}</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Text style={styles.pendingText}>{t('pending')}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )) : <Text style={styles.emptyText}>{t('noExpenses')}</Text>}
            </View>
          </>
        ) : null}

        {activeTab === 'profile' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('account')}</Text>
              <Text style={styles.title}>{user.firstName} {user.lastName}</Text>
              <Text style={styles.subtitle}>{t('accountCopy')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('user')}</Text>
              <Text style={styles.cardValue}>{user.email}</Text>
              <Text style={styles.cardLabel}>{t('role')}</Text>
              <Text style={styles.cardValue}>{roleLabel(user.role, language)}</Text>
              {currentFamilyMember ? (
                <>
                  <Text style={styles.cardLabel}>{t('myFamily')}</Text>
                  <Text style={styles.cardValue}>{familyMemberRoleLabel(currentFamilyMember.role, language)}</Text>
                </>
              ) : null}
            </View>
            <Pressable onPress={() => setActiveTab('privacy')} style={styles.privacyHighlight}>
              <View style={styles.privacyHighlightIcon}>
                <ShieldCheck color="#0f766e" size={22} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.childName}>{t('privacyCenter')}</Text>
                <Text style={styles.childDate}>{t('privacyVisibleCopy')}</Text>
              </View>
            </Pressable>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('languagePrivacy')}</Text>
              <Text style={styles.emptyText}>{t('privacyVisibleCopy')}</Text>
              <Pressable onPress={() => setActiveTab('privacy')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('privacyCenter')}</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('familySettings')}</Text>
              <Text style={styles.emptyText}>{t('familySettingsCopy')}</Text>
              <Pressable onPress={() => setActiveTab('settings')} style={styles.secondaryIconButton}>
                <Settings color="#0f766e" size={18} />
                <Text style={styles.secondaryCompactText}>{t('manageFamily')}</Text>
              </Pressable>
            </View>
            {primaryFamily && subscriptionState ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('plansAndSubscription')}</Text>
                <Text style={styles.emptyTitle}>{subscriptionPlanName(subscriptionState.effectivePlan, t)}</Text>
                <Text style={styles.emptyText}>
                  {subscriptionState.subscription.status === 'TRIALING' && subscriptionState.subscription.trialEndsAt
                    ? `${t('premiumTrial')} - ${daysUntil(subscriptionState.subscription.trialEndsAt)} ${t('trialDaysRemaining')}`
                    : t('familyWidePlan')}
                </Text>
                <Pressable onPress={() => setActiveTab('plans')} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{t('comparePlans')}</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{language === 'en' ? 'Exports' : 'Exportaciones'}</Text>
              <Text style={styles.emptyText}>{t('basicExportCopy')}</Text>
              <Pressable onPress={() => setActiveTab('exports')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Open exports' : 'Abrir exportaciones'}</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('informationHelp')}</Text>
              <Pressable onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/privacy`)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('privacyPolicy')}</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/terms`)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('terms')}</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/support`)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('support')}</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" onPress={onLogout} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t('logout')}</Text>
            </Pressable>
          </>
        ) : null}

        {activeTab === 'privacy' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('privacy')}</Text>
              <Text style={styles.title}>{t('privacyCenter')}</Text>
              <Text style={styles.subtitle}>{t('privacyVisibleCopy')}</Text>
            </View>
            <View style={styles.privacyHighlight}>
              <View style={styles.privacyHighlightIcon}>
                <ShieldCheck color="#0f766e" size={22} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.childName}>{language === 'en' ? 'Sensitive family data' : 'Datos familiares sensibles'}</Text>
                <Text style={styles.childDate}>
                  {language === 'en'
                    ? 'Coparent Global should help organize information without exposing children or family conflict.'
                    : 'Coparent Global debe ayudar a organizar información sin exponer a los hijos/as ni el conflicto familiar.'}
                </Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('languagePrivacy')}</Text>
              <View style={styles.choiceRow}>
                <ChoiceButton label={t('spanish')} active={language === 'es'} onPress={() => setAppLanguage('es')} />
                <ChoiceButton label={t('english')} active={language === 'en'} onPress={() => setAppLanguage('en')} />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingCopy}>
                  <Text style={styles.childName}>{t('productAnalytics')}</Text>
                  <Text style={styles.childDate}>{t('productAnalyticsCopy')}</Text>
                </View>
                <Switch value={privacy?.settings.allowProductAnalytics ?? false} onValueChange={(value) => updatePrivacyOption('allowProductAnalytics', value)} />
              </View>
              <Pressable
                disabled={!privacy?.settings.allowProductAnalytics}
                onPress={validateCrashReporting}
                style={[styles.secondaryButton, !privacy?.settings.allowProductAnalytics && styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>{t('sendDiagnosticTest')}</Text>
              </Pressable>
              <View style={styles.settingRow}>
                <View style={styles.settingCopy}>
                  <Text style={styles.childName}>{t('aiProcessing')}</Text>
                  <Text style={styles.childDate}>{t('aiProcessingCopy')}</Text>
                </View>
                <Switch value={privacy?.settings.allowAiProcessing ?? false} onValueChange={(value) => updatePrivacyOption('allowAiProcessing', value)} />
              </View>
              <Pressable onPress={manageDeletionRequest} style={privacy?.deletionRequest ? styles.secondaryButton : styles.dangerOutlineButton}>
                <Text style={privacy?.deletionRequest ? styles.secondaryButtonText : styles.dangerButtonText}>
                  {privacy?.deletionRequest ? t('cancelDeletion') : t('requestDeletion')}
                </Text>
              </Pressable>
              {privacy?.deletionRequest ? (
                <Pressable onPress={permanentlyDeleteAccount} style={styles.dangerOutlineButton}>
                  <Text style={styles.dangerButtonText}>{language === 'en' ? 'Delete account permanently' : 'Eliminar cuenta definitivamente'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('informationHelp')}</Text>
              <Pressable onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/privacy`)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('privacyPolicy')}</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/terms`)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('terms')}</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setActiveTab('profile')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Back to profile' : 'Volver al perfil'}</Text>
            </Pressable>
          </>
        ) : null}

        {activeTab === 'exports' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{language === 'en' ? 'Family records' : 'Registros familiares'}</Text>
              <Text style={styles.title}>{language === 'en' ? 'Exports' : 'Exportaciones'}</Text>
              <Text style={styles.subtitle}>
                {language === 'en'
                  ? 'Share a simple summary or generate a verifiable archive when your plan allows it.'
                  : 'Compartí un resumen simple o generá un archivo verificable cuando tu plan lo permita.'}
              </Text>
            </View>
            {primaryFamily ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('basicExport')}</Text>
                <Text style={styles.emptyText}>{t('basicExportCopy')}</Text>
                <Pressable onPress={shareBasicFamilyHtmlExport} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{t('basicExport')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('myFamily')}</Text>
                <Text style={styles.emptyText}>{language === 'en' ? 'Create a family before exporting records.' : 'Creá una familia antes de exportar registros.'}</Text>
              </View>
            )}
            {primaryFamily && subscriptionState?.entitlements.verifiedAuditExports ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('exportFamilyArchive')}</Text>
                <Text style={styles.emptyText}>{t('exportFamilyArchiveCopy')}</Text>
                <Pressable onPress={shareVerifiedArchive} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{t('exportFamilyArchive')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('exportFamilyArchive')}</Text>
                <Text style={styles.emptyText}>
                  {language === 'en'
                    ? 'Verifiable exports are available in higher plans. Basic summaries are free.'
                    : 'Las exportaciones verificables están disponibles en planes superiores. Los resúmenes básicos son gratis.'}
                </Text>
              </View>
            )}
            <Text style={styles.legalNotice}>{t('legalNotice')}</Text>
            <Pressable onPress={() => setActiveTab('profile')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Back to profile' : 'Volver al perfil'}</Text>
            </Pressable>
          </>
        ) : null}

        {activeTab === 'plans' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('plans')}</Text>
              <Text style={styles.title}>{t('plansAndSubscription')}</Text>
              <Text style={styles.subtitle}>{t('planAccountCopy')}</Text>
            </View>
            {subscriptionState ? (
              <>
                <View style={styles.currentPlanCard}>
                  <Text style={styles.currentPlanLabel}>{t('currentPlan')}</Text>
                  <Text style={styles.currentPlanTitle}>{subscriptionPlanName(subscriptionState.effectivePlan, t)}</Text>
                  <Text style={styles.currentPlanCopy}>
                    {subscriptionState.subscription.status === 'TRIALING' && subscriptionState.subscription.trialEndsAt
                      ? `${t('premiumTrial')} - ${daysUntil(subscriptionState.subscription.trialEndsAt)} ${t('trialDaysRemaining')}`
                      : t('familyWidePlan')}
                  </Text>
                  {subscriptionState.subscription.requestedPlan ? (
                    <Text style={styles.requestedPlanText}>
                      {t('requested')}: {subscriptionPlanName(subscriptionState.subscription.requestedPlan, t)}
                    </Text>
                  ) : null}
                </View>
                {!subscriptionState.billing.googlePlayReady ? (
                  <View style={styles.billingNotice}>
                    <Text style={styles.billingNoticeTitle}>{t('billingPendingTitle')}</Text>
                    <Text style={styles.billingNoticeCopy}>{t('billingPendingCopy')}</Text>
                  </View>
                ) : null}
                {subscriptionState.catalog.map((plan) => {
                  const isCurrent = plan.plan === subscriptionState.effectivePlan;
                  const isRequested = plan.plan === subscriptionState.subscription.requestedPlan;
                  const canManage = currentFamilyMember?.role === 'PRIMARY_PARENT';
                  return (
                    <View key={plan.plan} style={[styles.planCard, plan.recommended ? styles.recommendedPlanCard : undefined]}>
                      <View style={styles.planHeading}>
                        <View style={styles.planHeadingCopy}>
                          <Text style={styles.planName}>{subscriptionPlanName(plan.plan, t)}</Text>
                          {plan.recommended ? <Text style={styles.recommendedLabel}>{t('recommended')}</Text> : null}
                        </View>
                        <View style={styles.planPriceBlock}>
                          <Text style={styles.planPrice}>
                            {googlePlayPlanPrice(playSubscriptions, plan.googlePlayProductId, 'monthly') ??
                              formatPlanPrice(plan.monthlyPriceUsd, t)}
                          </Text>
                          {plan.monthlyPriceUsd > 0 ? <Text style={styles.planPriceUnit}>{t('perMonth')}</Text> : null}
                        </View>
                      </View>
                      {plan.annualPriceUsd > 0 ? (
                        <Text style={styles.planAnnualPrice}>
                          {googlePlayPlanPrice(playSubscriptions, plan.googlePlayProductId, 'annual') ??
                            `USD ${plan.annualPriceUsd.toFixed(2)}`} - {t('billedAnnually')}
                        </Text>
                      ) : null}
                      <View style={styles.planFeatures}>
                        {plan.featureCodes.map((featureCode) => (
                          <View key={featureCode} style={styles.planFeatureRow}>
                            <Text style={styles.planFeatureMark}>+</Text>
                            <Text style={styles.planFeatureText}>{subscriptionFeatureLabel(featureCode, t)}</Text>
                          </View>
                        ))}
                      </View>
                      {subscriptionState.billing.googlePlayReady ? (
                        isCurrent || plan.plan === 'BASIC' ? (
                          <Pressable
                            disabled={!canManage}
                            onPress={manageGooglePlaySubscription}
                            style={[styles.secondaryButton, !canManage ? styles.disabledButton : undefined]}
                          >
                            <Text style={styles.secondaryButtonText}>
                              {isCurrent && subscriptionState.subscription.provider !== 'GOOGLE_PLAY'
                                ? t('current')
                                : t('manageSubscription')}
                            </Text>
                          </Pressable>
                        ) : (
                          <View style={styles.planPurchaseActions}>
                            <Pressable
                              disabled={!canManage || requestingPlan !== null}
                              onPress={() => purchasePlan(plan.plan, 'monthly')}
                              style={[plan.recommended ? styles.primaryButton : styles.secondaryButton, !canManage ? styles.disabledButton : undefined]}
                            >
                              {requestingPlan === plan.plan ? (
                                <ActivityIndicator color={plan.recommended ? '#ffffff' : '#0f766e'} />
                              ) : (
                                <Text style={plan.recommended ? styles.primaryButtonText : styles.secondaryButtonText}>{t('buyMonthly')}</Text>
                              )}
                            </Pressable>
                            <Pressable
                              disabled={!canManage || requestingPlan !== null}
                              onPress={() => purchasePlan(plan.plan, 'annual')}
                              style={[styles.secondaryButton, !canManage ? styles.disabledButton : undefined]}
                            >
                              <Text style={styles.secondaryButtonText}>{t('buyAnnual')}</Text>
                            </Pressable>
                          </View>
                        )
                      ) : (
                        <Pressable
                          disabled={isCurrent || isRequested || requestingPlan !== null || (!canManage && !plan.contactSales)}
                          onPress={() => plan.contactSales ? Linking.openURL(`${PUBLIC_WEB_URL}/support`) : requestPlan(plan.plan)}
                          style={[
                            plan.recommended ? styles.primaryButton : styles.secondaryButton,
                            isCurrent || isRequested || (!canManage && !plan.contactSales) ? styles.disabledButton : undefined,
                          ]}
                        >
                          {requestingPlan === plan.plan ? (
                            <ActivityIndicator color={plan.recommended ? '#ffffff' : '#0f766e'} />
                          ) : (
                            <Text style={plan.recommended ? styles.primaryButtonText : styles.secondaryButtonText}>
                              {isCurrent ? t('current') : isRequested ? t('requested') : plan.contactSales ? t('contactSales') : t('requestPlan')}
                            </Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                {subscriptionState.billing.googlePlayReady ? (
                  <Pressable onPress={restoreGooglePlayPurchases} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{t('restorePurchases')}</Text>
                  </Pressable>
                ) : null}
                {currentFamilyMember?.role !== 'PRIMARY_PARENT' ? <Text style={styles.legalNotice}>{t('onlyPrimaryManagesPlan')}</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            ) : (
              <ActivityIndicator color="#0f766e" />
            )}
          </>
        ) : null}

        {activeTab === 'settings' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>{t('settings')}</Text>
              <Text style={styles.title}>{t('familySettings')}</Text>
              <Text style={styles.subtitle}>{t('familySettingsCopy')}</Text>
            </View>
            {primaryFamily ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('sharedFamily')}</Text>
                  <Text style={styles.cardValue}>{primaryFamily.tenant.name}</Text>
                  <Text style={styles.emptyText}>
                    {language === 'en'
                      ? 'The invitation includes a Google Play test link, a family invitation link, and a short explanation of what Coparent Global does.'
                      : 'La invitación incluye el link de prueba de Google Play, el link para unirse a la familia y una explicación corta de qué hace Coparent Global.'}
                  </Text>
                  {primaryFamily.members.map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      <View>
                        <Text style={styles.childName}>{member.user.firstName} {member.user.lastName}</Text>
                        <Text style={styles.childDate}>{member.user.email}</Text>
                      </View>
                      <Text style={styles.roleText}>{familyMemberRoleLabel(member.role, language)}</Text>
                    </View>
                  ))}
                  <Field
                    label={t('otherParentEmail')}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder={t('inviteEmailPlaceholder')}
                  />
                  <Pressable disabled={isInviting} onPress={submitInvite} style={[styles.primaryButton, isInviting ? styles.disabled : undefined]}>
                    {isInviting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{t('createShareInvitation')}</Text>}
                  </Pressable>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('childFormTitle')}</Text>
                  <Text style={styles.emptyTitle}>{editingChildId ? t('editChild') : t('addChild')}</Text>
                  <View style={styles.row}>
                    <Field label={t('firstName')} value={childForm.firstName} onChangeText={(value) => updateChildForm('firstName', value)} autoCapitalize="words" />
                    <Field label={t('lastName')} value={childForm.lastName} onChangeText={(value) => updateChildForm('lastName', value)} autoCapitalize="words" />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('birthDate')}</Text>
                    <View style={styles.dateSelectRow}>
                      <DateSelect label={t('day')} value={birthDateParts.day} placeholder="DD" onPress={() => setBirthDatePicker('day')} />
                      <DateSelect label={t('month')} value={birthDateParts.month} placeholder="MM" onPress={() => setBirthDatePicker('month')} />
                      <DateSelect label={t('year')} value={birthDateParts.year} placeholder="AAAA" onPress={() => setBirthDatePicker('year')} />
                    </View>
                  </View>
                  <Field label={t('optionalNotes')} value={childForm.observations} onChangeText={(value) => updateChildForm('observations', value)} multiline />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable
                    accessibilityRole="button"
                    disabled={isCreatingChild}
                    onPress={submitChild}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed ? styles.pressed : undefined,
                      isCreatingChild ? styles.disabled : undefined,
                    ]}
                  >
                    {isCreatingChild ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{editingChildId ? t('saveChanges') : t('addChild')}</Text>}
                  </Pressable>
                  {editingChildId ? (
                    <Pressable
                      onPress={() => {
                        setEditingChildId(null);
                        resetChildForm();
                      }}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>{t('cancelEdit')}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('coparentingMode')}</Text>
                  <Text style={styles.emptyText}>{t('modeCopy')}</Text>
                  <View style={styles.choiceRow}>
                    <ChoiceButton label={t('cooperative')} active={primaryFamily.settings?.relationshipMode === 'COOPERATIVE'} onPress={() => setRelationshipMode('COOPERATIVE')} />
                    <ChoiceButton label={t('structured')} active={primaryFamily.settings?.relationshipMode === 'STRUCTURED'} onPress={() => setRelationshipMode('STRUCTURED')} />
                    <ChoiceButton label={t('highConflict')} active={primaryFamily.settings?.relationshipMode === 'HIGH_CONFLICT'} onPress={() => setRelationshipMode('HIGH_CONFLICT')} />
                  </View>
                  <Text style={styles.legalNotice}>{t('legalNotice')}</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('integration')}</Text>
                  <Text style={styles.emptyTitle}>WhatsApp</Text>
                  <Text style={styles.emptyText}>{t('whatsappCopy')}</Text>
                  {whatsAppLinks.some((link) => link.familyId === primaryFamily.id && link.linkedAt) ? (
                    <View style={styles.connectedNotice}>
                      <Text style={styles.connectedTitle}>{t('whatsappConnected')}</Text>
                      <Text style={styles.connectedText}>{t('whatsappConnectedCopy')}</Text>
                    </View>
                  ) : null}
                  <Pressable disabled={isWhatsAppLoading} onPress={generateWhatsAppCode} style={[styles.primaryButton, isWhatsAppLoading ? styles.disabled : undefined]}>
                    {isWhatsAppLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{t('generateLinkCode')}</Text>}
                  </Pressable>
                  {whatsAppCode ? (
                    <View style={styles.whatsAppCodeBox}>
                      <Text style={styles.cardLabel}>{t('whatsappLinkInstruction')}</Text>
                      <Text selectable style={styles.whatsAppCode}>{buildWhatsAppLinkMessage(whatsAppCode.code, language)}</Text>
                      <Pressable onPress={openWhatsApp} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>{t('openWhatsApp')}</Text>
                      </Pressable>
                      <Text style={styles.legalNotice}>
                        {language === 'en'
                          ? `Manual code only if WhatsApp asks for it: VINCULAR ${whatsAppCode.code}`
                          : `Código manual solo si WhatsApp lo pide: VINCULAR ${whatsAppCode.code}`}
                      </Text>
                      <Text style={styles.childDate}>{t('expires')}: {formatDateTime(whatsAppCode.expiresAt)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.label}>{t('examples')}</Text>
                  <Text style={styles.childDate}>{language === 'en' ? 'I paid $35,000 for school supplies' : 'Gasté $35.000 en útiles escolares'}</Text>
                  <Text style={styles.childDate}>{language === 'en' ? 'CALENDAR | Mateo | 2026-06-10 18:00 | 2026-06-12 18:00' : 'CALENDARIO | Mateo | 2026-06-10 18:00 | 2026-06-12 18:00'}</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>{t('pendingApproval')}</Text>
                  <Text style={styles.emptyText}>{t('whatsappCopy')}</Text>
                  {pendingWhatsAppActions.length ? (
                    pendingWhatsAppActions.map((action) => (
                      <View key={action.id} style={styles.whatsAppAction}>
                        <Text style={styles.roleText}>{whatsAppActionLabel(action.type, t)}</Text>
                        <Text style={styles.childName}>{describeWhatsAppAction(action, t)}</Text>
                        <Text style={styles.childDate}>{whatsAppActionSourceLabel(action, t)}</Text>
                        {whatsAppActionHasAttachment(action) ? (
                          <>
                            <Text style={styles.roleText}>{t('attachmentDetected')}</Text>
                            <Text style={styles.childDate}>{t('attachmentNotStored')}</Text>
                          </>
                        ) : null}
                        <Text style={styles.childDate}>{formatDateTime(action.createdAt)}</Text>
                        <View style={styles.actionRow}>
                          <Pressable disabled={processingWhatsAppActionId === action.id} onPress={() => startEditingWhatsAppAction(action)} style={styles.secondarySmallButton}>
                            <Text style={styles.secondarySmallButtonText}>{t('editDraft')}</Text>
                          </Pressable>
                          <Pressable disabled={processingWhatsAppActionId === action.id} onPress={() => processWhatsAppAction(action.id, 'confirm')} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>{t('confirm')}</Text>
                          </Pressable>
                          <Pressable disabled={processingWhatsAppActionId === action.id} onPress={() => processWhatsAppAction(action.id, 'cancel')} style={styles.dangerButton}>
                            <Text style={styles.dangerButtonText}>{t('cancel')}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>{t('noPendingWhatsApp')}</Text>
                  )}
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <Pressable disabled={isWhatsAppLoading} onPress={refreshWhatsApp} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{t('updatePending')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('myFamily')}</Text>
                <Text style={styles.emptyText}>{t('createFamilyBeforeWhatsapp')}</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
      <Modal
        animationType="fade"
        transparent
        visible={editingWhatsAppActionId !== null}
        onRequestClose={() => setEditingWhatsAppActionId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.selectSheet}>
            <Text style={styles.emptyTitle}>{t('editPendingDraft')}</Text>
            <Text style={styles.label}>{t('draftText')}</Text>
            <TextInput
              multiline
              onChangeText={setWhatsAppDraftText}
              placeholderTextColor="#8390a4"
              style={[styles.input, styles.draftInput]}
              value={whatsAppDraftText}
            />
            <Pressable
              disabled={processingWhatsAppActionId === editingWhatsAppActionId}
              onPress={saveWhatsAppDraft}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{t('saveDraft')}</Text>
            </Pressable>
            <Pressable onPress={() => setEditingWhatsAppActionId(null)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={birthDatePicker !== null}
        onRequestClose={() => setBirthDatePicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.selectSheet}>
            <Text style={styles.emptyTitle}>
              {birthDatePicker ? birthDatePickerTitle(birthDatePicker, language) : ''}
            </Text>
            <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent}>
              {birthDateOptions.map((option) => {
                const active = birthDatePicker ? birthDateParts[birthDatePicker] === option.value : false;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => birthDatePicker && updateBirthDatePart(birthDatePicker, option.value)}
                    style={[styles.selectOption, active ? styles.selectOptionActive : undefined]}
                  >
                    <Text style={[styles.selectOptionText, active ? styles.selectOptionTextActive : undefined]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setBirthDatePicker(null)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={calendarPicker !== null}
        onRequestClose={() => setCalendarPicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.selectSheet}>
            <Text style={styles.emptyTitle}>
              {calendarPicker ? calendarPickerTitle(calendarPicker, language) : ''}
            </Text>
            <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent}>
              {calendarPickerOptions.map((option) => {
                const active = calendarPicker ? calendarForm[calendarPicker] === option.value : false;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      if (!calendarPicker) return;
                      setCalendarForm((current) => ({ ...current, [calendarPicker]: option.value }));
                      setCalendarPicker(null);
                    }}
                    style={[styles.selectOption, active ? styles.selectOptionActive : undefined]}
                  >
                    <Text style={[styles.selectOptionText, active ? styles.selectOptionTextActive : undefined]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setCalendarPicker(null)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TabButton icon={Home} label={t('home')} active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <TabButton icon={CalendarDays} label={t('calendar')} active={activeTab === 'calendar'} onPress={() => setActiveTab('calendar')} />
        <TabButton icon={MessageCircle} label={t('messages')} active={activeTab === 'messages'} onPress={() => setActiveTab('messages')} />
        <TabButton icon={ReceiptText} label={t('expenses')} active={activeTab === 'expenses'} onPress={() => setActiveTab('expenses')} />
        <TabButton icon={UserRound} label={t('profile')} active={activeTab === 'profile' || activeTab === 'plans' || activeTab === 'settings' || activeTab === 'privacy' || activeTab === 'exports'} onPress={() => setActiveTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

function ChoiceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceButton, active ? styles.choiceButtonActive : undefined]}>
      <Text style={[styles.choiceButtonText, active ? styles.choiceButtonTextActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

function DateSelect({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.dateSelect}>
      <Text style={styles.dateSelectLabel}>{label}</Text>
      <Text style={[styles.dateSelectValue, value ? undefined : styles.dateSelectPlaceholder]}>
        {value || placeholder}
      </Text>
    </Pressable>
  );
}

function TabButton({ icon: Icon, label, active, onPress }: { icon: LucideIcon; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.tabButton}>
      <Icon color={active ? '#0f766e' : '#718096'} size={20} strokeWidth={active ? 2.5 : 2} />
      <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value));
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value);
}

function toFormDateTime(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function roleLabel(role: AuthenticatedUser['role'], language: SupportedLanguage) {
  if (role === 'ADMIN') return translate(language, 'roleAdmin');
  return translate(language, 'roleParent');
}

function familyMemberRoleLabel(role: string, language: SupportedLanguage) {
  if (role === 'PRIMARY_PARENT') return translate(language, 'primaryParent');
  return translate(language, 'coparent');
}

function calendarEventTypeLabel(type: CalendarEventType, language: SupportedLanguage) {
  const option = calendarEventTypes.find((item) => item.value === type);
  return option ? (language === 'en' ? option.en : option.es) : type;
}

function calendarEventStatusLabel(status: CalendarEvent['status'], language: SupportedLanguage) {
  const labels: Record<CalendarEvent['status'], { es: string; en: string }> = {
    SCHEDULED: { es: 'Programado', en: 'Scheduled' },
    COMPLETED: { es: 'Completado', en: 'Completed' },
    CANCELLED: { es: 'Cancelado', en: 'Cancelled' },
    MISSED: { es: 'No realizado', en: 'Missed' },
  };
  return labels[status]?.[language] ?? status;
}

function buildFamilyInvitationShareMessage(invitationUrl: string, language: SupportedLanguage) {
  if (language === 'en') {
    return [
      'I invited you to Coparent Global.',
      'It helps separated or co-parenting families organize calendar, messages, expenses, and responsibilities with less conflict.',
      '',
      `1. Join the test on Google Play: ${playTestingUrl}`,
      `2. Open the family invitation: ${invitationUrl}`,
      '3. If Google Play says the app is unavailable, tell me which Gmail account you are using so I can add it as a tester.',
    ].join('\n');
  }

  return [
    'Te invité a Coparent Global.',
    'Es una app para familias separadas o coparentales: organiza calendario, mensajes, gastos y responsabilidades con menos conflicto.',
    '',
    `1. Sumate a la prueba en Google Play: ${playTestingUrl}`,
    `2. Abrí la invitación familiar: ${invitationUrl}`,
    '3. Si Google Play dice que no está disponible, pasame el Gmail que usás en el celular para agregarte como tester.',
  ].join('\n');
}

function buildWhatsAppLinkMessage(code: string, language: SupportedLanguage) {
  if (language === 'en') {
    return [
      'Coparent Global helps co-parenting families organize calendar, messages, expenses, and responsibilities with less conflict.',
      '',
      `Download or open the test app: ${playTestingUrl}`,
      `Then send this code to the official Coparent WhatsApp: LINK ${code}`,
      '',
      'Nothing is recorded automatically. Anything sent through WhatsApp remains pending until you confirm it inside the app.',
      'If Google Play says the app is unavailable, send the Gmail account used on the phone so it can be added as a tester.',
    ].join('\n');
  }

  return [
    'Coparent Global ayuda a familias separadas o coparentales a organizar calendario, mensajes, gastos y responsabilidades con menos conflicto.',
    '',
    `Descargá o abrí la app de prueba: ${playTestingUrl}`,
    `Después enviá este código al WhatsApp oficial de Coparent: VINCULAR ${code}`,
    '',
    'Nada se registra automáticamente. Todo lo enviado por WhatsApp queda pendiente hasta que lo confirmes dentro de la app.',
    'Si Google Play dice que la app no está disponible, enviá el Gmail usado en el celular para agregarlo como tester.',
  ].join('\n');
}

function expenseCategoryLabel(
  category: ExpenseCategory,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  const item = expenseCategories.find((candidate) => candidate.value === category);
  return item ? t(item.key) : category;
}

function whatsAppActionLabel(type: WhatsAppPendingAction['type'], t: (key: Parameters<typeof translate>[1]) => string) {
  if (type === 'EXPENSE') return t('whatsappExpense');
  if (type === 'CALENDAR_EVENT') return t('whatsappEvent');
  return t('whatsappNote');
}

function describeWhatsAppAction(action: WhatsAppPendingAction, t: (key: Parameters<typeof translate>[1]) => string) {
  if (action.type === 'EXPENSE') {
    return `${String(action.payload.description ?? t('whatsappExpenseFallback'))} - ${formatMoney(String(action.payload.amount ?? 0))}`;
  }
  if (action.type === 'CALENDAR_EVENT') {
    return `${formatDateTime(String(action.payload.startDate))} - ${formatDateTime(String(action.payload.endDate))}`;
  }
  return String(action.payload.content ?? action.originalText ?? t('whatsappContentFallback'));
}

function whatsAppActionSourceLabel(
  action: WhatsAppPendingAction,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  return action.payload.source === 'DEVICE_SHARE' ? t('sharedFromDevice') : t('sharedFromWhatsApp');
}

function whatsAppActionHasAttachment(action: WhatsAppPendingAction) {
  return Boolean(action.payload.attachment || action.mediaId);
}

function messageCategoryLabel(
  category: FamilyMessage['category'],
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  const keys: Record<FamilyMessage['category'], Parameters<typeof translate>[1]> = {
    LOGISTICS: 'messageLogistics',
    HEALTH: 'messageHealth',
    SCHOOL: 'messageSchool',
    EXPENSES: 'messageExpenses',
    URGENT: 'messageUrgent',
  };
  return t(keys[category]);
}

const localHostileTonePatterns = [
  /\bidiota\b/,
  /\bimbecil\b/,
  /\bestupid[oa]\b/,
  /\binutil\b/,
  /\bmierda\b/,
  /\bforr[oa]s?\b/,
  /\bforr[ei]s?\b/,
  /\bput[ao]s?\b/,
  /\bput[ei]s?\b/,
  /\bhij[oa]\s+de\s+put[ao]\b/,
  /\bhij[oa]\s+de\s+put[aeio]s?\b/,
  /\bputa\s+madre\b/,
  /\bmal\s+parid[ao]\b/,
  /\bmal[ae]s?\s+madres?\b/,
  /\bmal[ao]s?\s+padres?\b/,
  /\bmal\s+madre\b/,
  /\bmal\s+padre\b/,
  /\bbasura\b/,
  /\bpelotud[oa]s?\b/,
  /\bbolud[oa]s?\b/,
  /\btarad[oa]s?\b/,
  /\bsoret[ea]s?\b/,
  /\bconchud[oa]s?\b/,
  /\bcagon[ea]s?\b/,
  /\bdesgraciad[oa]s?\b/,
  /\basqueros[oa]s?\b/,
  /\bhdp\b/,
  /\bshut up\b/,
  /\bidiot\b/,
  /\bstupid\b/,
  /\bmoron\b/,
  /\bdumb\b/,
  /\buseless\b/,
  /\bfuck(?:ing)?\b/,
  /\bpiece of shit\b/,
  /\basshole\b/,
  /\bbitch\b/,
];

const localAccusatoryTonePatterns = [
  /\bsiempre\b/,
  /\bnunca\b/,
  /\btu culpa\b/,
  /\bpor tu culpa\b/,
  /\bno te importa\b/,
  /\bsos un[ao]\b/,
  /\beres un[ao]\b/,
  /\bme tenes cansad[oa]\b/,
  /\bme tienes cansad[oa]\b/,
  /\byour fault\b/,
  /\byou always\b/,
  /\byou never\b/,
  /\byou do not care\b/,
  /\byou don't care\b/,
];

function reviewMessageLocally(content: string, language: SupportedLanguage): MessageReview {
  const normalizedContent = normalizeToneText(content);
  const reasons: string[] = [];

  if (localHostileTonePatterns.some((pattern) => pattern.test(normalizedContent))) {
    reasons.push(language === 'en' ? 'It contains language that may feel hostile.' : 'Contiene lenguaje que puede sentirse hostil.');
  }
  if (localAccusatoryTonePatterns.some((pattern) => pattern.test(normalizedContent))) {
    reasons.push(language === 'en' ? 'It uses absolute or accusatory wording.' : 'Usa expresiones absolutas o acusatorias.');
  }
  if (content.length > 800) {
    reasons.push(language === 'en' ? 'A shorter message may be easier to answer.' : 'Un mensaje mas breve puede ser mas facil de responder.');
  }

  if (!reasons.length) return { needsReview: false, reasons, suggestion: null };

  return {
    needsReview: true,
    reasons,
    suggestion: language === 'en'
      ? 'I want to coordinate this for our child\'s wellbeing. Please confirm a concrete option that works for you.'
      : 'Quiero coordinar este tema pensando en el bienestar de nuestros hijos. Por favor, confirmame una alternativa concreta para resolverlo.',
  };
}

function normalizeToneText(content: string) {
  return content
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function subscriptionPlanName(
  plan: SubscriptionPlan,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  const keys: Record<SubscriptionPlan, Parameters<typeof translate>[1]> = {
    BASIC: 'basicPlan',
    PLUS: 'plusPlan',
    PREMIUM: 'premiumPlan',
    PROFESSIONAL: 'professionalPlan',
  };
  return t(keys[plan]);
}

function subscriptionFeatureLabel(
  featureCode: string,
  t: (key: Parameters<typeof translate>[1]) => string,
) {
  const keys: Record<string, Parameters<typeof translate>[1]> = {
    familyCore: 'familyCore',
    sharedCalendar: 'sharedCalendar',
    secureMessages: 'secureMessages',
    basicExpenses: 'basicExpenses',
    notifications: 'notifications',
    plusEverythingBasic: 'plusEverythingBasic',
    unlimitedChildren: 'unlimitedChildren',
    receipts: 'receipts',
    monthlyReports: 'monthlyReports',
    offlineSync: 'offlineSync',
    premiumEverythingPlus: 'premiumEverythingPlus',
    toneAssistant: 'toneAssistant',
    verifiedHistory: 'verifiedHistory',
    professionalExports: 'professionalExports',
    secureGuestLinks: 'secureGuestLinks',
    professionalEverythingPremium: 'professionalEverythingPremium',
    multiFamilyWorkspace: 'multiFamilyWorkspace',
    authorizedReadOnlyAccess: 'authorizedReadOnlyAccess',
    professionalReports: 'professionalReports',
  };
  return keys[featureCode] ? t(keys[featureCode]) : featureCode;
}

function formatPlanPrice(monthlyPriceUsd: number, t: (key: Parameters<typeof translate>[1]) => string) {
  return monthlyPriceUsd === 0 ? t('free') : `USD ${monthlyPriceUsd.toFixed(2)}`;
}

function googlePlayPlanPrice(
  subscriptions: ProductSubscription[],
  productId: string | null,
  basePlanId: 'monthly' | 'annual',
) {
  if (!productId) return null;
  return subscriptions
    .find((subscription) => subscription.id === productId)
    ?.subscriptionOffers?.find((offer) => offer.basePlanIdAndroid === basePlanId)
    ?.displayPrice ?? null;
}

function subscriptionPlanRank(plan: SubscriptionPlan) {
  return { BASIC: 0, PLUS: 1, PREMIUM: 2, PROFESSIONAL: 3 }[plan];
}

function daysUntil(value: string) {
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function extractInvitationToken(url: string | null) {
  if (!url || !url.startsWith('coparentglobal://invite')) return null;
  return extractUrlParam(url, 'token');
}

function extractGoogleAuthResult(url: string | null) {
  if (!url || !url.startsWith('coparentglobal://auth/google')) return null;
  return {
    accessToken: extractUrlParam(url, 'accessToken'),
    error: extractUrlParam(url, 'error'),
  };
}

function extractUrlParam(url: string, name: string) {
  const match = url.match(new RegExp(`[?&]${name}=([^&]+)`));
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#5d6b82',
    fontSize: 15,
    fontWeight: '700',
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: 22,
    justifyContent: 'center',
    padding: 24,
  },
  protectedContainer: {
    flexGrow: 1,
    gap: 20,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
  },
  kicker: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#172033',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    color: '#5d6b82',
    fontSize: 16,
    lineHeight: 23,
  },
  authValueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  authValuePill: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0b5f59',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  authTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  onboardingPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  onboardingActionGrid: {
    gap: 10,
  },
  onboardingPrimaryAction: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  onboardingPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  onboardingSecondaryAction: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  onboardingSecondaryText: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  onboardingQuietAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  onboardingQuietText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  buildBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f3f1',
    borderColor: '#b7ddd8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0b5f59',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  languageToggle: {
    backgroundColor: '#e8edf4',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
  },
  languageButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  languageButtonActive: {
    backgroundColor: '#ffffff',
  },
  languageButtonText: {
    color: '#5d6b82',
    fontSize: 12,
    fontWeight: '800',
  },
  languageButtonTextActive: {
    color: '#0b5f59',
  },
  segmented: {
    backgroundColor: '#e8edf4',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 4,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 11,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeButtonText: {
    color: '#5d6b82',
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#172033',
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 7,
  },
  label: {
    color: '#344256',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#172033',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  draftInput: {
    minHeight: 140,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  dateSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateSelect: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateSelectLabel: {
    color: '#5d6b82',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateSelectValue: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  dateSelectPlaceholder: {
    color: '#94a3b8',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#0f766e',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.45,
  },
  secondaryButtonText: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryIconButton: {
    alignItems: 'center',
    borderColor: '#0f766e',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  googleButtonText: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
  error: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 8,
    borderWidth: 1,
    color: '#be123c',
    padding: 12,
  },
  notice: {
    backgroundColor: '#e6f3f1',
    borderColor: '#b7ddd8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0b5f59',
    padding: 12,
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  linkButtonText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  apiHint: {
    color: '#718096',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  privacyHighlight: {
    alignItems: 'flex-start',
    backgroundColor: '#e6f3f1',
    borderColor: '#99d4cc',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  privacyHighlightIcon: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  currentPlanCard: {
    backgroundColor: '#123c36',
    borderRadius: 8,
    gap: 5,
    padding: 18,
  },
  currentPlanLabel: {
    color: '#b9e3dc',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  currentPlanTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  currentPlanCopy: {
    color: '#d8f1ed',
    fontSize: 14,
    lineHeight: 20,
  },
  requestedPlanText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  billingNotice: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  billingNoticeTitle: {
    color: '#92400e',
    fontSize: 15,
    fontWeight: '800',
  },
  billingNoticeCopy: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 19,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  recommendedPlanCard: {
    borderColor: '#0f766e',
    borderWidth: 2,
  },
  planHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  planHeadingCopy: {
    flex: 1,
    gap: 5,
  },
  planName: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '800',
  },
  recommendedLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f3f1',
    borderRadius: 6,
    color: '#0b5f59',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  planPriceBlock: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: '#0f766e',
    fontSize: 18,
    fontWeight: '800',
  },
  planPriceUnit: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '700',
  },
  planAnnualPrice: {
    color: '#5d6b82',
    fontSize: 12,
    fontWeight: '700',
  },
  planFeatures: {
    gap: 8,
  },
  planPurchaseActions: {
    gap: 8,
  },
  planFeatureRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  planFeatureMark: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '900',
  },
  planFeatureText: {
    color: '#344256',
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  cardLabel: {
    color: '#5d6b82',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statTile: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 76,
    padding: 12,
  },
  statValue: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#5d6b82',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  dashboardItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#e6f3f1',
    borderRadius: 8,
    flexBasis: '48%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  quickActionText: {
    color: '#0b5f59',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyTitle: {
    color: '#172033',
    fontSize: 22,
    fontWeight: '800',
  },
  emptyText: {
    color: '#5d6b82',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8,
  },
  nextSteps: {
    backgroundColor: '#e6f3f1',
    borderRadius: 8,
    padding: 16,
  },
  nextTitle: {
    color: '#0b5f59',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  nextText: {
    color: '#0b5f59',
    fontSize: 15,
    lineHeight: 21,
  },
  childrenList: {
    gap: 10,
    marginTop: 4,
  },
  childItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  childName: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  childDate: {
    color: '#5d6b82',
    fontSize: 14,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  secondarySmallButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#d8dee8',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondarySmallButtonText: {
    color: '#344256',
    fontWeight: '800',
  },
  smallButton: {
    backgroundColor: '#e6f3f1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#0b5f59',
    fontWeight: '800',
  },
  dangerButton: {
    backgroundColor: '#fff1f2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerButtonText: {
    color: '#be123c',
    fontWeight: '800',
  },
  memberItem: {
    alignItems: 'center',
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  roleText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
  eventItem: {
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  choiceButton: {
    backgroundColor: '#e8edf4',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceButtonActive: {
    backgroundColor: '#0f766e',
  },
  choiceButtonText: {
    color: '#344256',
    fontWeight: '800',
  },
  choiceButtonTextActive: {
    color: '#ffffff',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  selectSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 12,
    maxHeight: '78%',
    padding: 18,
  },
  selectOptions: {
    maxHeight: 360,
  },
  selectOptionsContent: {
    gap: 8,
    paddingBottom: 4,
  },
  selectOption: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  selectOptionActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  selectOptionText: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '800',
  },
  selectOptionTextActive: {
    color: '#ffffff',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#d8dee8',
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 74,
    paddingTop: 6,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabButtonText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#0f766e',
  },
  expenseItem: {
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    gap: 8,
    paddingVertical: 12,
  },
  expenseHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  expenseDescription: {
    flex: 1,
  },
  amountText: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  allocationRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingHorizontal: 10,
  },
  allocationText: {
    color: '#344256',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  paidText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
  },
  pendingText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },
  connectedNotice: {
    backgroundColor: '#e6f3f1',
    borderRadius: 8,
    gap: 3,
    padding: 12,
  },
  connectedTitle: {
    color: '#0b5f59',
    fontSize: 15,
    fontWeight: '800',
  },
  connectedText: {
    color: '#0b5f59',
    fontSize: 13,
    lineHeight: 18,
  },
  whatsAppCodeBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginTop: 6,
    padding: 14,
  },
  whatsAppCode: {
    color: '#172033',
    fontSize: 22,
    fontWeight: '800',
  },
  whatsAppAction: {
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 12,
  },
  offlineNotice: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  offlineText: {
    color: '#92400e',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  cancelledText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '800',
  },
  messageItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#d8dee8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 12,
  },
  ownMessage: {
    backgroundColor: '#e6f3f1',
    borderColor: '#b7ddd8',
  },
  messageHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageText: {
    color: '#172033',
    fontSize: 15,
    lineHeight: 21,
  },
  readText: {
    color: '#718096',
    fontSize: 11,
    textAlign: 'right',
  },
  assistantNotice: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  assistantNoticeWarning: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  assistantTitle: {
    color: '#be123c',
    fontSize: 15,
    fontWeight: '800',
  },
  assistantReason: {
    color: '#be123c',
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryCompactButton: {
    alignItems: 'center',
    borderColor: '#0f766e',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  secondaryCompactText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryCompactButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  balanceRow: {
    alignItems: 'center',
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  balanceValues: {
    alignItems: 'flex-end',
  },
  reportRow: {
    alignItems: 'center',
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  receiptText: {
    color: '#0f766e',
    fontSize: 12,
    marginTop: 3,
  },
  legalNotice: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    color: '#5d6b82',
    fontSize: 12,
    lineHeight: 17,
    padding: 10,
  },
  settingRow: {
    alignItems: 'center',
    borderBottomColor: '#e8edf4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingCopy: {
    flex: 1,
  },
  dangerOutlineButton: {
    alignItems: 'center',
    borderColor: '#be123c',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
  },
});
