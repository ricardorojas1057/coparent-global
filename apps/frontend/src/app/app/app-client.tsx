'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { publicApiUrl, publicRequest } from '../public-api';

type AuthMode = 'login' | 'register';
type WebTab = 'home' | 'calendar' | 'messages' | 'expenses' | 'profile';

type SessionAuthResponse = {
  accessToken: string;
  userId: string;
  email: string;
};

type RegistrationResponse =
  | SessionAuthResponse
  | {
      requiresEmailVerification: true;
      email: string;
      delivered: boolean;
      message: string;
    };

type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'PARENT' | 'ADMIN';
  firstName: string;
  lastName: string;
};

type Tenant = {
  id: string;
  name: string;
  type: string;
};

type FamilyMember = {
  id: string;
  role: string;
  user: { id: string; email: string; firstName: string; lastName: string };
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
};

type Family = {
  id: string;
  tenant: { id: string; name: string; type: string };
  children: Child[];
  members: FamilyMember[];
};

type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  status: 'SCHEDULED' | 'CANCELLED' | 'MISSED';
  startDate: string;
  endDate: string;
  location?: string | null;
  notes?: string | null;
  child: Child & { familyId: string };
  currentParent: { id: string; email: string; firstName: string; lastName: string };
};

type ChatMessage = {
  id: string;
  content: string;
  category?: ChatCategory | null;
  createdAt: string;
  aiIntervened?: boolean;
  aiSuggestion?: string | null;
  sender: { id: string; email: string; firstName: string; lastName: string };
};

type CommunicationReview = {
  needsReview: boolean;
  reasons: string[];
  suggestion: string | null;
};

type Expense = {
  id: string;
  familyId: string;
  description: string;
  category: ExpenseCategory;
  amount: string | number;
  createdAt: string;
  storageKey?: string | null;
  payer: { id: string; email: string; firstName: string; lastName: string };
  allocations: Array<{
    id: string;
    amountDue: string | number;
    percentage: string | number;
    status: 'PENDING' | 'PAID' | 'REJECTED' | 'OBSERVED';
    user: { id: string; email: string; firstName: string; lastName: string };
  }>;
};

type ExpenseSummary = {
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

type FamilyExportResponse = {
  fileName: string;
  mimeType: string;
  html: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

type ChildFormState = {
  familyId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  observations: string;
};

type EventFormState = {
  childId: string;
  currentParentId: string;
  title: string;
  type: CalendarEventType;
  location: string;
  notes: string;
  startDate: string;
  endDate: string;
};

type MessageFormState = {
  category: ChatCategory;
  content: string;
};

type ExpenseFormState = {
  paidById: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  splitMode: 'SHARED' | 'SINGLE_PAYER';
  receiptReference: string;
};

type CalendarEventType = 'CARE' | 'SCHOOL' | 'HEALTH' | 'ACTIVITY' | 'PICKUP_DROPOFF' | 'OTHER';
type ChatCategory = 'LOGISTICS' | 'HEALTH' | 'SCHOOL' | 'EXPENSES' | 'URGENT';
type ExpenseCategory = 'SCHOOL' | 'HEALTH' | 'CLOTHING' | 'TRANSPORT' | 'FOOD' | 'EXTRACURRICULAR' | 'OTHER';

const storageKey = 'coparent-global-web-session';

const tabs: Array<{ id: WebTab; label: string }> = [
  { id: 'home', label: 'Inicio' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'messages', label: 'Mensajes' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'profile', label: 'Perfil' },
];

const eventTypes: Array<{ id: CalendarEventType; label: string }> = [
  { id: 'CARE', label: 'Cuidado' },
  { id: 'SCHOOL', label: 'Escuela' },
  { id: 'HEALTH', label: 'Salud' },
  { id: 'ACTIVITY', label: 'Actividad' },
  { id: 'PICKUP_DROPOFF', label: 'Entrega / retiro' },
  { id: 'OTHER', label: 'Otro' },
];

const messageCategories: Array<{ id: ChatCategory; label: string }> = [
  { id: 'LOGISTICS', label: 'Logística' },
  { id: 'HEALTH', label: 'Salud' },
  { id: 'SCHOOL', label: 'Escuela' },
  { id: 'EXPENSES', label: 'Gastos' },
  { id: 'URGENT', label: 'Urgente' },
];

const expenseCategories: Array<{ id: ExpenseCategory; label: string }> = [
  { id: 'SCHOOL', label: 'Escuela' },
  { id: 'HEALTH', label: 'Salud' },
  { id: 'CLOTHING', label: 'Ropa' },
  { id: 'TRANSPORT', label: 'Transporte' },
  { id: 'FOOD', label: 'Alimentos' },
  { id: 'EXTRACURRICULAR', label: 'Actividad extra' },
  { id: 'OTHER', label: 'Otro' },
];

function authRequest<T>(path: string, accessToken: string, options: RequestInit = {}) {
  return publicRequest<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    },
  });
}

function requiresEmailVerification(response: RegistrationResponse): response is Extract<RegistrationResponse, { requiresEmailVerification: true }> {
  return 'requiresEmailVerification' in response;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(value: string | number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(value));
}

function asIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function displayName(person: { firstName?: string; lastName?: string; email?: string }) {
  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return name || person.email || 'Usuario';
}

function initialEventForm(family?: Family): EventFormState {
  return {
    childId: family?.children[0]?.id ?? '',
    currentParentId: family?.members[0]?.user.id ?? '',
    title: '',
    type: 'CARE',
    location: '',
    notes: '',
    startDate: '',
    endDate: '',
  };
}

function initialExpenseForm(family?: Family): ExpenseFormState {
  return {
    paidById: family?.members[0]?.user.id ?? '',
    description: '',
    category: 'SCHOOL',
    amount: '',
    splitMode: 'SHARED',
    receiptReference: '',
  };
}

export function AppClient() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [activeTab, setActiveTab] = useState<WebTab>('home');
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [familyName, setFamilyName] = useState('');
  const [childForm, setChildForm] = useState<ChildFormState>({
    familyId: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    observations: '',
  });
  const [eventForm, setEventForm] = useState<EventFormState>(initialEventForm());
  const [messageForm, setMessageForm] = useState<MessageFormState>({ category: 'LOGISTICS', content: '' });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm());
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [toneReview, setToneReview] = useState<CommunicationReview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingFamily, setIsSavingFamily] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isReviewingTone, setIsReviewingTone] = useState(false);

  const apiHost = useMemo(() => publicApiUrl.replace(/^https?:\/\//, ''), []);
  const selectedFamily = families.find((family) => family.id === selectedFamilyId) ?? families[0];
  const filteredEvents = calendarEvents.filter((event) => event.child.familyId === selectedFamily?.id);
  const filteredExpenses = expenses.filter((expense) => expense.familyId === selectedFamily?.id);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(storageKey);
    if (storedToken) {
      setToken(storedToken);
      void loadSession(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token && selectedFamilyId) {
      void loadFamilyWorkspace(token, selectedFamilyId);
    }
  }, [token, selectedFamilyId]);

  async function loadSession(accessToken: string) {
    setIsLoading(true);
    setError('');
    try {
      const [currentUser, myFamilies] = await Promise.all([
        authRequest<AuthenticatedUser>('/auth/me', accessToken),
        authRequest<Family[]>('/families', accessToken),
      ]);
      const nextFamilyId = selectedFamilyId || myFamilies[0]?.id || '';
      setUser(currentUser);
      setFamilies(myFamilies);
      setSelectedFamilyId(nextFamilyId);
      setChildForm((current) => ({ ...current, familyId: current.familyId || nextFamilyId }));
      setEventForm((current) => {
        const initial = initialEventForm(myFamilies.find((family) => family.id === nextFamilyId) ?? myFamilies[0]);
        return {
          ...current,
          childId: current.childId || initial.childId,
          currentParentId: current.currentParentId || initial.currentParentId,
        };
      });
      setExpenseForm((current) => {
        const initial = initialExpenseForm(myFamilies.find((family) => family.id === nextFamilyId) ?? myFamilies[0]);
        return { ...current, paidById: current.paidById || initial.paidById };
      });
      window.localStorage.setItem(storageKey, accessToken);
      if (nextFamilyId) await loadFamilyWorkspace(accessToken, nextFamilyId);
    } catch (caught) {
      window.localStorage.removeItem(storageKey);
      setToken('');
      setUser(null);
      setFamilies([]);
      setError(caught instanceof Error ? caught.message : 'No pudimos abrir tu sesión.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFamilyWorkspace(accessToken: string, familyId: string) {
    try {
      const [eventsResponse, messagesResponse, expensesResponse, summaryResponse] = await Promise.all([
        authRequest<CalendarEvent[]>('/calendar-events', accessToken),
        authRequest<ChatMessage[]>(`/families/${familyId}/messages`, accessToken),
        authRequest<Expense[]>('/expenses', accessToken),
        authRequest<ExpenseSummary>(`/expenses/summary?familyId=${encodeURIComponent(familyId)}`, accessToken),
      ]);
      setCalendarEvents(eventsResponse);
      setMessages(messagesResponse);
      setExpenses(expensesResponse);
      setExpenseSummary(summaryResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos cargar los datos familiares.');
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const response = await publicRequest<SessionAuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        setToken(response.accessToken);
        await loadSession(response.accessToken);
        setMessage('Sesión iniciada correctamente.');
        return;
      }

      const response = await publicRequest<RegistrationResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        }),
      });

      if (requiresEmailVerification(response)) {
        setMode('login');
        setMessage(response.message || 'Revisá tu email para verificar la cuenta antes de ingresar.');
        return;
      }

      setToken(response.accessToken);
      await loadSession(response.accessToken);
      setMessage('Cuenta creada correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos completar la operación.');
    } finally {
      setIsLoading(false);
    }
  }

  async function createFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError('');
    setMessage('');
    setIsSavingFamily(true);

    try {
      const tenant = await authRequest<Tenant>('/tenants', token, {
        method: 'POST',
        body: JSON.stringify({ name: familyName.trim(), type: 'B2C_DIRECT' }),
      });
      const family = await authRequest<Family>('/families', token, {
        method: 'POST',
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      setFamilyName('');
      setSelectedFamilyId(family.id);
      await loadSession(token);
      setMessage('Familia creada. Ya podés agregar hijos/as desde la web.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos crear la familia.');
    } finally {
      setIsSavingFamily(false);
    }
  }

  async function addChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError('');
    setMessage('');
    setIsSavingChild(true);

    try {
      await authRequest('/children', token, {
        method: 'POST',
        body: JSON.stringify({
          familyId: childForm.familyId,
          firstName: childForm.firstName.trim(),
          lastName: childForm.lastName.trim(),
          birthDate: childForm.birthDate,
          observations: childForm.observations.trim() || undefined,
        }),
      });
      setChildForm((current) => ({ ...current, firstName: '', lastName: '', birthDate: '', observations: '' }));
      await loadSession(token);
      setMessage('Hijo/a agregado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos agregar el hijo/a.');
    } finally {
      setIsSavingChild(false);
    }
  }

  async function createCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedFamily) return;
    setError('');
    setMessage('');
    setIsSavingEvent(true);

    try {
      await authRequest('/calendar-events', token, {
        method: 'POST',
        body: JSON.stringify({
          childId: eventForm.childId,
          currentParentId: eventForm.currentParentId,
          title: eventForm.title.trim(),
          type: eventForm.type,
          location: eventForm.location.trim() || undefined,
          notes: eventForm.notes.trim() || undefined,
          startDate: asIsoDateTime(eventForm.startDate),
          endDate: asIsoDateTime(eventForm.endDate),
        }),
      });
      setEventForm(initialEventForm(selectedFamily));
      await loadFamilyWorkspace(token, selectedFamily.id);
      setMessage('Evento creado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos crear el evento.');
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function cancelCalendarEvent(eventId: string) {
    if (!token || !selectedFamily) return;
    setError('');
    setMessage('');
    try {
      await authRequest(`/calendar-events/${eventId}`, token, { method: 'DELETE' });
      await loadFamilyWorkspace(token, selectedFamily.id);
      setMessage('Evento cancelado.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos cancelar el evento.');
    }
  }

  async function reviewMessageTone() {
    if (!token || !selectedFamily || !messageForm.content.trim()) return;
    setError('');
    setToneReview(null);
    setIsReviewingTone(true);
    try {
      const review = await authRequest<CommunicationReview>(`/families/${selectedFamily.id}/messages/review`, token, {
        method: 'POST',
        body: JSON.stringify({ content: messageForm.content.trim(), locale: 'es-AR' }),
      });
      setToneReview(review);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos revisar el tono.');
    } finally {
      setIsReviewingTone(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedFamily) return;
    setError('');
    setMessage('');
    setIsSavingMessage(true);

    try {
      const response = await authRequest<{ message: ChatMessage; review: CommunicationReview }>(`/families/${selectedFamily.id}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({
          content: messageForm.content.trim(),
          category: messageForm.category,
          clientMutationId: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        }),
      });
      setToneReview(response.review);
      setMessageForm((current) => ({ ...current, content: '' }));
      await loadFamilyWorkspace(token, selectedFamily.id);
      setMessage(response.review.needsReview ? 'Mensaje enviado. También quedó registrada una sugerencia de tono.' : 'Mensaje enviado.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos enviar el mensaje.');
    } finally {
      setIsSavingMessage(false);
    }
  }

  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedFamily) return;
    setError('');
    setMessage('');
    setIsSavingExpense(true);

    try {
      await authRequest('/expenses', token, {
        method: 'POST',
        body: JSON.stringify({
          familyId: selectedFamily.id,
          paidById: expenseForm.paidById,
          description: expenseForm.description.trim(),
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          splitMode: expenseForm.splitMode,
          receiptReference: expenseForm.receiptReference.trim() || undefined,
        }),
      });
      setExpenseForm(initialExpenseForm(selectedFamily));
      await loadFamilyWorkspace(token, selectedFamily.id);
      setMessage('Gasto registrado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos registrar el gasto.');
    } finally {
      setIsSavingExpense(false);
    }
  }

  async function downloadFamilyExport() {
    if (!token || !selectedFamily) return;
    setError('');
    try {
      const response = await authRequest<FamilyExportResponse>(`/families/${selectedFamily.id}/exports/basic?language=es`, token);
      const blob = new Blob([response.html], { type: response.mimeType || 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.fileName || 'coparent-global-export.html';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Exportación generada. Recordá que no constituye constancia legal universal.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos generar la exportación.');
    }
  }

  function changeFamily(familyId: string) {
    const family = families.find((item) => item.id === familyId);
    setSelectedFamilyId(familyId);
    setChildForm((current) => ({ ...current, familyId }));
    setEventForm(initialEventForm(family));
    setExpenseForm(initialExpenseForm(family));
    setToneReview(null);
  }

  function logout() {
    window.localStorage.removeItem(storageKey);
    setToken('');
    setUser(null);
    setFamilies([]);
    setCalendarEvents([]);
    setMessages([]);
    setExpenses([]);
    setExpenseSummary(null);
    setMessage('');
    setError('');
  }

  if (user) {
    return (
      <section className="web-app-shell" aria-labelledby="web-app-title">
        <div className="web-app-header">
          <div>
            <p className="eyebrow">Sesión activa</p>
            <h1 id="web-app-title">Hola, {user.firstName || user.email}</h1>
            <p className="lead">Este es tu espacio familiar web. Podés usarlo desde el navegador o instalarlo en la pantalla principal como una app.</p>
          </div>
          <button className="secondary-button" onClick={logout} type="button">Salir</button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}

        {families.length ? (
          <div className="web-toolbar">
            <label>
              Familia activa
              <select value={selectedFamilyId} onChange={(event) => changeFamily(event.target.value)}>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>{family.tenant.name}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <nav className="web-tabbar" aria-label="Secciones de Coparent Global web">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'home' ? renderHome() : null}
        {activeTab === 'calendar' ? renderCalendar() : null}
        {activeTab === 'messages' ? renderMessages() : null}
        {activeTab === 'expenses' ? renderExpenses() : null}
        {activeTab === 'profile' ? renderProfile() : null}
      </section>
    );
  }

  return (
    <section className="web-app-shell" aria-labelledby="web-login-title">
      <p className="eyebrow">Coparent Global</p>
      <h1 id="web-login-title">Entrar desde el navegador</h1>
      <p className="lead">
        Iniciá sesión o creá una cuenta desde Chrome, Edge o Safari. Después podés instalar esta página en la pantalla principal.
      </p>

      <div className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="Modo de acceso">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Ingresar
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Registrarme
          </button>
        </div>

        <form className="action-form web-auth-form" onSubmit={submit}>
          {mode === 'register' ? (
            <div className="form-row">
              <label>
                Nombre
                <input autoComplete="given-name" required value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
              </label>
              <label>
                Apellido
                <input autoComplete="family-name" required value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
              </label>
            </div>
          ) : null}

          <label>
            Email
            <input autoComplete="email" inputMode="email" required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            Contraseña
            <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          {mode === 'register' ? (
            <label>
              Teléfono opcional
              <input autoComplete="tel" inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <button disabled={isLoading} type="submit">
            {isLoading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="web-app-help">
          <a href="/reset-password">Olvidé mi contraseña</a>
          <a href="/verify-email">Reenviar verificación de email</a>
          <a href="/install">Instalar en pantalla principal</a>
        </div>
      </div>

      {token && !user ? <p className="fine-print">Validando sesión...</p> : null}
      <p className="fine-print">API: {apiHost}</p>
    </section>
  );

  function renderHome() {
    return (
      <>
        <div className="web-app-grid">
          <article className="resource-card">
            <span>Usuario</span>
            <p>{user?.email}</p>
            <p>Rol: {user?.role === 'PARENT' ? 'Progenitor/a' : user?.role}</p>
          </article>
          <article className="resource-card">
            <span>Familias</span>
            <p>{families.length ? `${families.length} familia(s) vinculada(s).` : 'Todavía no tenés familias vinculadas.'}</p>
          </article>
        </div>

        {!families.length ? (
          <article className="resource-card web-action-card">
            <span>Crear primera familia</span>
            <p>Empezá el espacio familiar desde la web. Después vas a poder invitar al otro progenitor y organizar la información.</p>
            <form className="action-form web-inline-form" onSubmit={createFamily}>
              <label>
                Nombre del espacio familiar
                <input placeholder="Ej: Familia Rojas" required value={familyName} onChange={(event) => setFamilyName(event.target.value)} />
              </label>
              <button disabled={isSavingFamily || !familyName.trim()} type="submit">
                {isSavingFamily ? 'Creando...' : 'Crear familia'}
              </button>
            </form>
          </article>
        ) : (
          <>
            <div className="web-app-list">
              {families.map((family) => (
                <article className="resource-card" key={family.id}>
                  <span>{family.tenant.name}</span>
                  <p>Integrantes: {family.members.length}</p>
                  <p>Hijos/as: {family.children.length}</p>
                  {family.children.length ? (
                    <ul className="compact-list">
                      {family.children.map((child) => (
                        <li key={child.id}>{child.firstName} {child.lastName} · {formatDate(child.birthDate)}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>

            <article className="resource-card web-action-card">
              <span>Agregar hijo/a</span>
              <p>Registrá los datos básicos para empezar a ordenar calendario, mensajes y gastos familiares.</p>
              <form className="action-form web-inline-form" onSubmit={addChild}>
                <label>
                  Familia
                  <select required value={childForm.familyId} onChange={(event) => setChildForm((current) => ({ ...current, familyId: event.target.value }))}>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>{family.tenant.name}</option>
                    ))}
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    Nombre
                    <input required value={childForm.firstName} onChange={(event) => setChildForm((current) => ({ ...current, firstName: event.target.value }))} />
                  </label>
                  <label>
                    Apellido
                    <input required value={childForm.lastName} onChange={(event) => setChildForm((current) => ({ ...current, lastName: event.target.value }))} />
                  </label>
                </div>
                <label>
                  Fecha de nacimiento
                  <input required type="date" value={childForm.birthDate} onChange={(event) => setChildForm((current) => ({ ...current, birthDate: event.target.value }))} />
                </label>
                <label>
                  Observaciones opcionales
                  <textarea rows={3} value={childForm.observations} onChange={(event) => setChildForm((current) => ({ ...current, observations: event.target.value }))} />
                </label>
                <button disabled={isSavingChild} type="submit">{isSavingChild ? 'Guardando...' : 'Agregar hijo/a'}</button>
              </form>
            </article>
          </>
        )}
      </>
    );
  }

  function renderCalendar() {
    if (!selectedFamily) return <EmptyState title="Primero creá una familia" text="Después vas a poder cargar eventos, responsables y horarios." />;

    return (
      <div className="web-section-grid">
        <article className="resource-card web-action-card">
          <span>Calendario</span>
          <h2>Nuevo evento</h2>
          {!selectedFamily.children.length ? (
            <p>Agregá al menos un hijo/a para crear eventos.</p>
          ) : (
            <form className="action-form web-inline-form" onSubmit={createCalendarEvent}>
              <label>
                Nombre del evento
                <input required placeholder="Ej: Consulta con pediatra" value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <div className="button-choice-group">
                {eventTypes.map((type) => (
                  <button className={eventForm.type === type.id ? 'active' : ''} key={type.id} onClick={() => setEventForm((current) => ({ ...current, type: type.id }))} type="button">
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="form-row">
                <label>
                  Hijo/a
                  <select required value={eventForm.childId} onChange={(event) => setEventForm((current) => ({ ...current, childId: event.target.value }))}>
                    {selectedFamily.children.map((child) => (
                      <option key={child.id} value={child.id}>{child.firstName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Responsable
                  <select required value={eventForm.currentParentId} onChange={(event) => setEventForm((current) => ({ ...current, currentParentId: event.target.value }))}>
                    {selectedFamily.members.map((member) => (
                      <option key={member.user.id} value={member.user.id}>{displayName(member.user)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Inicio
                  <input required type="datetime-local" value={eventForm.startDate} onChange={(event) => setEventForm((current) => ({ ...current, startDate: event.target.value }))} />
                </label>
                <label>
                  Fin
                  <input required type="datetime-local" value={eventForm.endDate} onChange={(event) => setEventForm((current) => ({ ...current, endDate: event.target.value }))} />
                </label>
              </div>
              <label>
                Lugar opcional
                <input value={eventForm.location} onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))} />
              </label>
              <label>
                Notas opcionales
                <textarea rows={3} value={eventForm.notes} onChange={(event) => setEventForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
              <button disabled={isSavingEvent} type="submit">{isSavingEvent ? 'Guardando...' : 'Crear evento'}</button>
            </form>
          )}
        </article>

        <article className="resource-card">
          <span>Próximos eventos</span>
          {!filteredEvents.length ? <p>Todavía no hay eventos familiares.</p> : null}
          <div className="stack-list">
            {filteredEvents.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.title}</strong>
                <small>{eventTypes.find((type) => type.id === item.type)?.label ?? item.type} · {item.child.firstName}</small>
                <p>{formatDateTime(item.startDate)} - {formatDateTime(item.endDate)}</p>
                <p>Responsable: {displayName(item.currentParent)}</p>
                {item.location ? <p>{item.location}</p> : null}
                {item.notes ? <p>{item.notes}</p> : null}
                {item.status !== 'CANCELLED' ? <button className="danger-button" type="button" onClick={() => cancelCalendarEvent(item.id)}>Cancelar</button> : <small>Cancelado</small>}
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderMessages() {
    if (!selectedFamily) return <EmptyState title="Primero creá una familia" text="Después vas a poder enviar mensajes trazables." />;

    return (
      <div className="web-section-grid">
        <article className="resource-card">
          <span>Conversación</span>
          {!messages.length ? <p>Todavía no hay mensajes familiares.</p> : null}
          <div className="stack-list">
            {messages.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{displayName(item.sender)}</strong>
                <small>{messageCategories.find((category) => category.id === item.category)?.label ?? 'Mensaje'} · {formatDateTime(item.createdAt)}</small>
                <p>{item.content}</p>
                {item.aiIntervened && item.aiSuggestion ? <p className="tone-warning">Sugerencia registrada: {item.aiSuggestion}</p> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="resource-card web-action-card">
          <span>Nuevo mensaje</span>
          <form className="action-form web-inline-form" onSubmit={sendMessage}>
            <div className="button-choice-group">
              {messageCategories.map((category) => (
                <button className={messageForm.category === category.id ? 'active' : ''} key={category.id} onClick={() => setMessageForm((current) => ({ ...current, category: category.id }))} type="button">
                  {category.label}
                </button>
              ))}
            </div>
            <label>
              Mensaje
              <textarea required rows={5} value={messageForm.content} onChange={(event) => setMessageForm((current) => ({ ...current, content: event.target.value }))} />
            </label>
            {toneReview ? (
              toneReview.needsReview ? (
                <div className="tone-warning">
                  <strong>Conviene revisar el tono antes de enviar.</strong>
                  <ul>
                    {toneReview.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  {toneReview.suggestion ? <p>Sugerencia: {toneReview.suggestion}</p> : null}
                </div>
              ) : <p className="form-success">El mensaje se percibe claro y neutral.</p>
            ) : null}
            <div className="form-actions">
              <button className="secondary-button" disabled={isReviewingTone || !messageForm.content.trim()} onClick={reviewMessageTone} type="button">
                {isReviewingTone ? 'Revisando...' : 'Revisar tono'}
              </button>
              <button disabled={isSavingMessage || !messageForm.content.trim()} type="submit">
                {isSavingMessage ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </article>
      </div>
    );
  }

  function renderExpenses() {
    if (!selectedFamily) return <EmptyState title="Primero creá una familia" text="Después vas a poder registrar gastos y ver saldos." />;

    return (
      <div className="web-section-grid">
        <article className="resource-card web-action-card">
          <span>Gastos</span>
          <h2>Registrar gasto</h2>
          <form className="action-form web-inline-form" onSubmit={createExpense}>
            <label>
              Descripción
              <input required placeholder="Ej: Útiles escolares" value={expenseForm.description} onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <div className="form-row">
              <label>
                Importe
                <input inputMode="decimal" min="0.01" required step="0.01" type="number" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} />
              </label>
              <label>
                Pagó
                <select required value={expenseForm.paidById} onChange={(event) => setExpenseForm((current) => ({ ...current, paidById: event.target.value }))}>
                  {selectedFamily.members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>{displayName(member.user)}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Categoría
              <select value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </label>
            <div className="button-choice-group">
              <button className={expenseForm.splitMode === 'SHARED' ? 'active' : ''} onClick={() => setExpenseForm((current) => ({ ...current, splitMode: 'SHARED' }))} type="button">Dividir entre integrantes</button>
              <button className={expenseForm.splitMode === 'SINGLE_PAYER' ? 'active' : ''} onClick={() => setExpenseForm((current) => ({ ...current, splitMode: 'SINGLE_PAYER' }))} type="button">Lo pagó una sola parte</button>
            </div>
            <label>
              Comprobante o referencia opcional
              <input placeholder="Ej: transferencia, ticket, archivo guardado" value={expenseForm.receiptReference} onChange={(event) => setExpenseForm((current) => ({ ...current, receiptReference: event.target.value }))} />
            </label>
            <button disabled={isSavingExpense} type="submit">{isSavingExpense ? 'Guardando...' : 'Registrar gasto'}</button>
          </form>
        </article>

        <article className="resource-card">
          <span>Resumen de saldos</span>
          {expenseSummary ? (
            <>
              <p>Total pendiente: {formatCurrency(expenseSummary.totalOutstanding, expenseSummary.currency)}</p>
              <div className="stack-list">
                {expenseSummary.balances.map((balance) => (
                  <div className="list-item" key={balance.user.id}>
                    <strong>{displayName(balance.user)}</strong>
                    <p>Pagó: {formatCurrency(balance.paid, expenseSummary.currency)}</p>
                    <p>Debe: {formatCurrency(balance.owes, expenseSummary.currency)}</p>
                    <p>A cobrar: {formatCurrency(balance.receivable, expenseSummary.currency)}</p>
                    <small>Saldo neto: {formatCurrency(balance.net, expenseSummary.currency)}</small>
                  </div>
                ))}
              </div>
            </>
          ) : <p>Cargando resumen...</p>}
        </article>

        <article className="resource-card web-full-width">
          <span>Movimientos</span>
          {!filteredExpenses.length ? <p>Todavía no hay gastos registrados.</p> : null}
          <div className="stack-list">
            {filteredExpenses.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.description}</strong>
                <small>{expenseCategories.find((category) => category.id === item.category)?.label ?? item.category} · {formatDate(item.createdAt)}</small>
                <p>{formatCurrency(item.amount, expenseSummary?.currency ?? 'ARS')} · Pagó {displayName(item.payer)}</p>
                {item.storageKey ? <p>Comprobante: {item.storageKey}</p> : null}
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="web-section-grid">
        <article className="resource-card">
          <span>Perfil</span>
          <p>{user?.email}</p>
          <p>{displayName(user ?? {})}</p>
          <p>Rol: {user?.role === 'PARENT' ? 'Progenitor/a' : user?.role}</p>
        </article>
        <article className="resource-card">
          <span>Privacidad</span>
          <p>Podés revisar la política de privacidad, solicitar eliminación de cuenta y usar exportaciones con una aclaración de alcance.</p>
          <div className="web-link-list">
            <a href="/privacy">Política de privacidad</a>
            <a href="/account-deletion">Eliminar cuenta</a>
            {selectedFamily ? <button className="text-button" type="button" onClick={downloadFamilyExport}>Descargar exportación básica familiar</button> : null}
          </div>
        </article>
        <article className="install-note web-full-width">
          Para usar Coparent Global como app en el celular, tocá <a href="/install">Instalar en pantalla principal</a>. No necesitás descargarla desde Google Play.
        </article>
      </div>
    );
  }
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <article className="resource-card">
      <span>{title}</span>
      <p>{text}</p>
    </article>
  );
}
