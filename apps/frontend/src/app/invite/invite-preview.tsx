'use client';

import { useEffect, useState } from 'react';
import { publicRequest } from '../public-api';

const androidDownloadUrl =
  process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ??
  'https://expo.dev/artifacts/eas/3aw7SdkCrBenYqAsupcsy1.apk';

type InvitationPreview = {
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  familyName: string;
  inviter: { firstName: string; lastName: string };
  role: string;
  emailHint: string | null;
};

export function InvitePreview({ token }: { token?: string }) {
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('El enlace de invitacion esta incompleto.');
      return;
    }
    publicRequest<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`)
      .then(setInvitation)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'No pudimos abrir la invitacion.'));
  }, [token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!invitation) return <p>Revisando la invitacion...</p>;

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
          <a className="primary-link" href={`coparentglobal://invite?token=${encodeURIComponent(token)}`}>
            Abrir Coparent Global para aceptar
          </a>
        ) : <p className="form-error">Esta invitacion ya no esta disponible para aceptar.</p>}
        <a className="secondary-link" href={androidDownloadUrl}>
          Descargar Coparent Global para Android
        </a>
        {invitation.status === 'PENDING' ? (
          <p className="fine-print">
            Si instalas la app ahora, volve a abrir este enlace de invitacion para aceptar la familia.
          </p>
        ) : null}
      </div>
      <p className="fine-print">Acepta solamente si reconoces a la persona que te invito. Necesitas iniciar sesion o registrarte en la app.</p>
    </div>
  );
}
