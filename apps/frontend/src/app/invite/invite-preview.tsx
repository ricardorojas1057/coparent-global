'use client';

import { useEffect, useState } from 'react';
import { publicRequest } from '../public-api';

type InvitationPreview = {
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  familyName: string;
  inviter: { firstName: string; lastName: string };
  role: string;
  emailHint: string | null;
  guestResponse: 'INTERESTED' | 'DECLINED' | null;
  guestRespondedAt: string | null;
};

export function InvitePreview({ token }: { token?: string }) {
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('El enlace de invitación está incompleto.');
      return;
    }
    publicRequest<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`)
      .then(setInvitation)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'No pudimos abrir la invitación.'));
  }, [token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!invitation) return <p>Revisando la invitación...</p>;

  async function respond(response: 'INTERESTED' | 'DECLINED') {
    if (!token) return;
    setResponding(true);
    setError('');
    try {
      const result = await publicRequest<{ guestResponse: 'INTERESTED' | 'DECLINED'; guestRespondedAt: string; message: string }>(
        `/invitations/${encodeURIComponent(token)}/respond`,
        { method: 'POST', body: JSON.stringify({ response }) },
      );
      setInvitation((current) => current ? { ...current, guestResponse: result.guestResponse, guestRespondedAt: result.guestRespondedAt } : current);
      setResponseMessage(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos registrar tu respuesta.');
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="invitation-preview">
      <dl>
        <div><dt>Familia</dt><dd>{invitation.familyName}</dd></div>
        <div><dt>Invita</dt><dd>{invitation.inviter.firstName} {invitation.inviter.lastName}</dd></div>
        <div><dt>Acceso</dt><dd>{invitation.role.replaceAll('_', ' ')}</dd></div>
        {invitation.emailHint ? <div><dt>Email invitado</dt><dd>{invitation.emailHint}</dd></div> : null}
      </dl>
      <div className="invitation-actions">
        {invitation.status === 'PENDING' && token ? (
          <>
            <p className="fine-print">Podés responder ahora sin instalar nada. Esto no crea una cuenta ni habilita acceso familiar.</p>
            <div className="response-actions">
              <button disabled={responding} className="primary-link" onClick={() => respond('INTERESTED')}>
                Quiero participar
              </button>
              <button disabled={responding} className="secondary-link" onClick={() => respond('DECLINED')}>
                No participaré
              </button>
            </div>
            {responseMessage ? <p className="form-success">{responseMessage}</p> : null}
            {invitation.guestResponse ? <p className="fine-print">Respuesta actual: {invitation.guestResponse === 'INTERESTED' ? 'quiero participar' : 'no participaré'}.</p> : null}
            <a className="primary-link" href={`/app?invite=${encodeURIComponent(token)}`}>
              Entrar a Coparent Global desde la web
            </a>
          </>
        ) : <p className="form-error">Esta invitación ya no está disponible para aceptar.</p>}
        <a className="secondary-link" href="/install">
          Instalar en pantalla principal
        </a>
        {invitation.status === 'PENDING' ? (
          <p className="fine-print">
            Si instalás Coparent Global como app web, volvé a abrir este enlace para aceptar la familia.
          </p>
        ) : null}
      </div>
      <p className="fine-print">Aceptá definitivamente solamente si reconocés a la persona que te invitó. El acceso familiar siempre requiere iniciar sesión o registrarse.</p>
    </div>
  );
}
