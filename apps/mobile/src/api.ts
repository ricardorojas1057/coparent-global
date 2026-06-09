import { API_URL } from './config';

export type AuthMode = 'login' | 'register';

export type AuthResponse = {
  accessToken: string;
  userId: string;
  email: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'PARENT' | 'ADMIN';
  firstName: string;
  lastName: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  firstName: string;
  lastName: string;
  phone?: string;
};

export type FamilyInvitation = {
  id: string;
  email: string | null;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  expiresAt: string;
  shareUrl: string;
  delivered: boolean;
};

export type FamilyInvitationPreview = {
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  familyName: string;
  inviter: { firstName: string; lastName: string };
  role: string;
  emailHint: string | null;
  expiresAt: string;
};

export type Tenant = {
  id: string;
  name: string;
  type: 'B2C_DIRECT' | 'MEDIATOR' | 'LAW_FIRM' | 'GOVERNMENT';
  createdAt: string;
};

export type Family = {
  id: string;
  tenantId: string;
  createdAt: string;
  tenant: Tenant;
  settings?: {
    id: string;
    relationshipMode: RelationshipMode;
    locale: string;
    currency: string;
    timezone: string;
    countryCode: string;
    jurisdictionNotice?: string | null;
    enableAiModeration: boolean;
    enablePushNotifications: boolean;
  } | null;
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    observations?: string | null;
  }>;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
};

export type RelationshipMode = 'COOPERATIVE' | 'STRUCTURED' | 'HIGH_CONFLICT';

export type ChildInput = {
  familyId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  observations?: string;
};

export type UpdateChildInput = Omit<ChildInput, 'familyId'>;

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  location?: string | null;
  notes?: string | null;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  child: {
    id: string;
    firstName: string;
    lastName: string;
    familyId: string;
  };
  currentParent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  changeRequests?: CalendarChangeRequest[];
};

export type CalendarEventType = 'CARE' | 'SCHOOL' | 'HEALTH' | 'ACTIVITY' | 'PICKUP_DROPOFF' | 'OTHER';

export type CreateCalendarEventInput = {
  childId: string;
  currentParentId: string;
  title: string;
  type: CalendarEventType;
  location?: string;
  notes?: string;
  startDate: string;
  endDate: string;
};

export type UpdateCalendarEventInput = Partial<Omit<CreateCalendarEventInput, 'childId'>> & {
  status?: CalendarEvent['status'];
};

export type CalendarChangeRequest = {
  id: string;
  calendarEventId: string;
  requestedById: string;
  newStartDate: string;
  newEndDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  reason?: string | null;
  createdAt: string;
  calendarEvent?: CalendarEvent;
};

export type ExpenseCategory = 'SCHOOL' | 'HEALTH' | 'CLOTHING' | 'TRANSPORT' | 'FOOD' | 'EXTRACURRICULAR' | 'OTHER';
export type ExpenseSplitMode = 'SHARED' | 'SINGLE_PAYER';

export type Expense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  createdAt: string;
  payer: { id: string; firstName: string; lastName: string; email: string };
  storageProvider: string;
  storageKey?: string | null;
  mimeType?: string | null;
  allocations: Array<{
    id: string;
    userId: string;
    percentage: string;
    amountDue: string;
    status: 'PENDING' | 'PAID' | 'REJECTED' | 'OBSERVED';
    user: { id: string; firstName: string; lastName: string; email: string };
  }>;
};

export type CreateExpenseInput = {
  familyId: string;
  paidById: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  splitMode?: ExpenseSplitMode;
  receiptReference?: string;
};

export type ExpenseSummary = {
  familyId: string;
  currency: string;
  totalOutstanding: number;
  balances: Array<{
    user: { id: string; firstName: string; lastName: string };
    paid: number;
    owes: number;
    receivable: number;
    net: number;
  }>;
};

export type ExpenseMonthlyReport = {
  familyId: string;
  month: string;
  currency: string;
  total: number;
  previousMonthTotal: number;
  changePercentage: number | null;
  sharedTotal: number;
  individualTotal: number;
  outstandingTotal: number;
  byCategory: Array<{ category: ExpenseCategory; total: number; percentage: number }>;
  byPayer: Array<{ user: { id: string; firstName: string; lastName: string }; total: number }>;
};

export type MessageReview = {
  needsReview: boolean;
  reasons: string[];
  suggestion: string | null;
};

export type FamilyMessage = {
  id: string;
  familyId: string;
  senderId: string;
  content: string;
  category: 'LOGISTICS' | 'HEALTH' | 'SCHOOL' | 'EXPENSES' | 'URGENT';
  aiSuggestion?: string | null;
  aiIntervened: boolean;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; email: string };
  reads: Array<{ userId: string; viewedAt: string }>;
};

export type PrivacyState = {
  settings: {
    preferredLocale: string;
    allowProductAnalytics: boolean;
    allowAiProcessing: boolean;
  };
  deletionRequest: { id: string; status: 'PENDING' | 'CANCELLED' | 'COMPLETED'; requestedAt: string } | null;
};

export type WhatsAppLinkCode = {
  code: string;
  expiresAt: string;
  instruction: string;
};

export type WhatsAppLink = {
  id: string;
  familyId: string;
  linkedAt: string | null;
  waId: string | null;
  family: { tenant: { name: string } };
};

export type WhatsAppPendingAction = {
  id: string;
  type: 'EXPENSE' | 'CALENDAR_EVENT' | 'NOTE';
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  originalText: string | null;
  mediaId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  link: {
    familyId: string;
    family: { tenant: { name: string } };
  };
};

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join('\n')
          : 'No pudimos completar la operacion.';

    throw new Error(message);
  }

  return body as T;
}

export type QueuedMutation = {
  id: string;
  path: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  createdAt: string;
};

export function executeQueuedMutation(accessToken: string, mutation: QueuedMutation): Promise<unknown> {
  return request(mutation.path, {
    method: mutation.method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: mutation.body === undefined ? undefined : JSON.stringify(mutation.body),
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
  return request<AuthenticatedUser>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getMyFamilies(accessToken: string): Promise<Family[]> {
  return request<Family[]>('/families', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createTenant(accessToken: string, name: string): Promise<Tenant> {
  return request<Tenant>('/tenants', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, type: 'B2C_DIRECT' }),
  });
}

export function createFamily(accessToken: string, tenantId: string): Promise<Family> {
  return request<Family>('/families', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tenantId }),
  });
}

export function createChild(accessToken: string, input: ChildInput): Promise<Family['children'][number]> {
  return request<Family['children'][number]>('/children', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function updateChild(
  accessToken: string,
  childId: string,
  input: UpdateChildInput,
): Promise<Family['children'][number]> {
  return request<Family['children'][number]>(`/children/${childId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function deleteChild(accessToken: string, childId: string): Promise<{ deleted: true }> {
  return request<{ deleted: true }>(`/children/${childId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function addFamilyMember(accessToken: string, familyId: string, email: string) {
  return request<Family['members'][number]>(`/families/${familyId}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ email }),
  });
}

export function createFamilyInvitation(accessToken: string, familyId: string, email?: string) {
  return request<FamilyInvitation>(`/families/${familyId}/invitations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ email: email || undefined, role: 'SECONDARY_PARENT' }),
  });
}

export function getFamilyInvitationPreview(token: string) {
  return request<FamilyInvitationPreview>(`/invitations/${encodeURIComponent(token)}`, { method: 'GET' });
}

export function acceptFamilyInvitation(accessToken: string, token: string) {
  return request<{ familyId: string; familyName: string }>(`/invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateFamilySettings(
  accessToken: string,
  familyId: string,
  input: {
    relationshipMode?: RelationshipMode;
    locale?: string;
    currency?: string;
    timezone?: string;
    countryCode?: string;
  },
) {
  return request<NonNullable<Family['settings']>>(`/families/${familyId}/settings`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function getCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  return request<CalendarEvent[]>('/calendar-events', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createCalendarEvent(
  accessToken: string,
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  return request<CalendarEvent>('/calendar-events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function updateCalendarEvent(accessToken: string, eventId: string, input: UpdateCalendarEventInput) {
  return request<CalendarEvent>(`/calendar-events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function cancelCalendarEvent(accessToken: string, eventId: string) {
  return request<CalendarEvent>(`/calendar-events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getCalendarChangeRequests(accessToken: string) {
  return request<CalendarChangeRequest[]>('/calendar-events/change-requests', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function requestCalendarChange(
  accessToken: string,
  eventId: string,
  input: { newStartDate: string; newEndDate: string; reason?: string },
) {
  return request<CalendarChangeRequest>(`/calendar-events/${eventId}/change-requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function resolveCalendarChange(
  accessToken: string,
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
) {
  return request<CalendarChangeRequest>(`/calendar-events/change-requests/${requestId}/resolve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  });
}

export function getExpenses(accessToken: string): Promise<Expense[]> {
  return request<Expense[]>('/expenses', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createExpense(accessToken: string, input: CreateExpenseInput): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function markExpenseAllocationPaid(accessToken: string, allocationId: string) {
  return request<Expense['allocations'][number]>(`/expenses/allocations/${allocationId}/pay`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateExpenseAllocationStatus(
  accessToken: string,
  allocationId: string,
  status: 'PAID' | 'OBSERVED' | 'REJECTED',
) {
  return request<Expense['allocations'][number]>(`/expenses/allocations/${allocationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  });
}

export function getExpenseSummary(accessToken: string, familyId: string) {
  return request<ExpenseSummary>(`/expenses/summary?familyId=${encodeURIComponent(familyId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getExpenseMonthlyReport(accessToken: string, familyId: string, month: string) {
  return request<ExpenseMonthlyReport>(
    `/expenses/report?familyId=${encodeURIComponent(familyId)}&month=${encodeURIComponent(month)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

export function registerPushDevice(accessToken: string, token: string, platform: 'android' | 'ios') {
  return request<{ id: string; token: string }>('/notifications/devices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ token, platform }),
  });
}

export function removePushDevice(accessToken: string, token: string) {
  return request<{ removed: boolean }>('/notifications/devices', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ token }),
  });
}

export function getFamilyMessages(accessToken: string, familyId: string) {
  return request<FamilyMessage[]>(`/families/${familyId}/messages`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function reviewFamilyMessage(accessToken: string, familyId: string, content: string, locale: string) {
  return request<MessageReview>(`/families/${familyId}/messages/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content, locale }),
  });
}

export function createFamilyMessage(
  accessToken: string,
  familyId: string,
  input: { content: string; category?: FamilyMessage['category'] },
) {
  return request<{ message: FamilyMessage; review: MessageReview }>(`/families/${familyId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function getPrivacy(accessToken: string) {
  return request<PrivacyState>('/account/privacy', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updatePrivacy(
  accessToken: string,
  input: Partial<PrivacyState['settings']>,
) {
  return request<PrivacyState['settings']>('/account/privacy', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function requestAccountDeletion(accessToken: string) {
  return request<NonNullable<PrivacyState['deletionRequest']>>('/account/deletion-request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function cancelAccountDeletion(accessToken: string) {
  return request<NonNullable<PrivacyState['deletionRequest']>>('/account/deletion-request', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createWhatsAppLinkCode(accessToken: string, familyId: string): Promise<WhatsAppLinkCode> {
  return request<WhatsAppLinkCode>('/whatsapp/link-code', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ familyId }),
  });
}

export function getWhatsAppLinks(accessToken: string): Promise<WhatsAppLink[]> {
  return request<WhatsAppLink[]>('/whatsapp/links', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getWhatsAppActions(accessToken: string): Promise<WhatsAppPendingAction[]> {
  return request<WhatsAppPendingAction[]>('/whatsapp/actions', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function confirmWhatsAppAction(accessToken: string, actionId: string): Promise<WhatsAppPendingAction> {
  return request<WhatsAppPendingAction>(`/whatsapp/actions/${actionId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function cancelWhatsAppAction(accessToken: string, actionId: string): Promise<WhatsAppPendingAction> {
  return request<WhatsAppPendingAction>(`/whatsapp/actions/${actionId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
