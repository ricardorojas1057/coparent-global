'use client';

import { FormEvent, useState } from 'react';
import { publicRequest } from '../public-api';

export function ResetPasswordForm({ token }: { token?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (token && password !== confirmation) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const result = token
        ? await publicRequest<{ message: string }>('/auth/password-reset/confirm', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
          })
        : await publicRequest<{ message: string }>('/auth/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
      setMessage(result.message);
      setPassword('');
      setConfirmation('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos completar la operacion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="action-form" onSubmit={submit}>
      {token ? (
        <>
          <label>
            Nueva contrasena
            <input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <label>
            Repetir contrasena
            <input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />
          </label>
        </>
      ) : (
        <label>
          Email de tu cuenta
          <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
      )}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      <button disabled={loading} type="submit">
        {loading ? 'Procesando...' : token ? 'Cambiar contrasena' : 'Enviar enlace'}
      </button>
    </form>
  );
}
