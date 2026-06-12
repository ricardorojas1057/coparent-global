'use client';

import { useEffect, useState } from 'react';
import { publicRequest } from '../public-api';

export function VerifyEmailForm({ token }: { token?: string }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    publicRequest<{ message: string }>('/auth/email-verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((result) => setMessage(result.message))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'No pudimos verificar el email.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <p className="form-error">El enlace no contiene un token de verificacion.</p>;
  if (loading) return <p>Verificando email...</p>;
  if (error) return <p className="form-error">{error}</p>;
  return <p className="form-success">{message}</p>;
}
