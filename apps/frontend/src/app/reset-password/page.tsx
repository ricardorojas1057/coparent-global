import { LegalPage } from '../legal-page';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <LegalPage
      eyebrow="Acceso seguro"
      title={token ? 'Elegir una nueva contrasena' : 'Recuperar contrasena'}
      summary={token ? 'El enlace solo puede utilizarse una vez y cerrara las sesiones anteriores.' : 'Si el email corresponde a una cuenta, recibiras un enlace de recuperacion.'}
    >
      <section><ResetPasswordForm token={token} /></section>
    </LegalPage>
  );
}
