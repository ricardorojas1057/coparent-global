import { LegalPage } from '../legal-page';
import { InvitePreview } from './invite-preview';

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <LegalPage eyebrow="Invitacion familiar" title="Participar en Coparent Global" summary="Revisa los datos antes de abrir la app y aceptar el acceso a una familia.">
      <section><InvitePreview token={token} /></section>
    </LegalPage>
  );
}
