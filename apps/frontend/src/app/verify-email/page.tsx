import { LegalPage } from '../legal-page';
import { VerifyEmailForm } from './verify-email-form';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <LegalPage
      eyebrow="Acceso seguro"
      title="Verificar email"
      summary="La verificacion confirma que la direccion utilizada para la cuenta te pertenece."
    >
      <section><VerifyEmailForm token={token} /></section>
    </LegalPage>
  );
}
