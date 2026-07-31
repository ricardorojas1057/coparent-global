'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { publicApiUrl, publicRequest } from '../public-api';

type AuthMode = 'login' | 'register';

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

type Family = {
  id: string;
  tenant: { id: string; name: string; type: string };
  children: Array<{ id: string; firstName: string; lastName: string; birthDate: string }>;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; email: string; firstName: string; lastName: string };
  }>;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

const storageKey = 'coparent-global-web-session';

function authRequest<T>(path: string, accessToken: string) {
  return publicRequest<T>(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function requiresEmailVerification(response: RegistrationResponse): response is Extract<RegistrationResponse, { requiresEmailVerification: true }> {
  return 'requiresEmailVerification' in response;
}

export function AppClient() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [token, setToken] = useState('');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiHost = useMemo(() => publicApiUrl.replace(/^https?:\/\//, ''), []);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(storageKey);
    if (storedToken) {
      setToken(storedToken);
      void loadSession(storedToken);
    }
  }, []);

  async function loadSession(accessToken: string) {
    setIsLoading(true);
    setError('');
    try {
      const [currentUser, myFamilies] = await Promise.all([
        authRequest<AuthenticatedUser>('/auth/me', accessToken),
        authRequest<Family[]>('/families', accessToken),
      ]);
      setUser(currentUser);
      setFamilies(myFamilies);
      window.localStorage.setItem(storageKey, accessToken);
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

  function logout() {
    window.localStorage.removeItem(storageKey);
    setToken('');
    setUser(null);
    setFamilies([]);
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
            <p className="lead">Este es el acceso web básico de Coparent Global. La app instalada sigue teniendo la experiencia completa.</p>
          </div>
          <button className="secondary-button" onClick={logout} type="button">Salir</button>
        </div>

        <div className="web-app-grid">
          <article className="resource-card">
            <span>Usuario</span>
            <p>{user.email}</p>
            <p>Rol: {user.role === 'PARENT' ? 'Progenitor/a' : user.role}</p>
          </article>
          <article className="resource-card">
            <span>Familias</span>
            <p>{families.length ? `${families.length} familia(s) vinculada(s).` : 'Todavía no tenés familias vinculadas.'}</p>
          </article>
        </div>

        {families.length ? (
          <div className="web-app-list">
            {families.map((family) => (
              <article className="resource-card" key={family.id}>
                <span>{family.tenant.name}</span>
                <p>Integrantes: {family.members.length}</p>
                <p>Hijos/as: {family.children.length}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="install-note">
            Para crear familia, agregar hijos/as, eventos, mensajes y gastos, usá la app Android de Google Play o abrí el enlace de invitación familiar.
          </div>
        )}
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
                <input
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                />
              </label>
              <label>
                Apellido
                <input
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                />
              </label>
            </div>
          ) : null}

          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          {mode === 'register' ? (
            <label>
              Teléfono opcional
              <input
                autoComplete="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
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
}
