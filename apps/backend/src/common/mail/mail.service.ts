import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  publicWebUrl() {
    return this.config.get<string>('PUBLIC_WEB_URL') ?? 'https://coparent-global.vercel.app';
  }

  async sendPasswordReset(email: string, token: string) {
    const url = `${this.publicWebUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    return this.send({
      to: email,
      subject: 'Recupera tu acceso a Coparent Global',
      text: `Solicitaste cambiar tu contrasena. Abri este enlace dentro de los proximos 30 minutos: ${url}\n\nSi no fuiste vos, ignora este mensaje.`,
    });
  }

  async sendFamilyInvitation(email: string, token: string, familyName: string) {
    const url = `${this.publicWebUrl()}/invite?token=${encodeURIComponent(token)}`;
    return this.send({
      to: email,
      subject: `Invitacion a ${familyName} en Coparent Global`,
      text: `Te invitaron a participar de ${familyName} en Coparent Global. Abri este enlace dentro de los proximos 7 dias: ${url}\n\nAcepta solamente si reconoces a la persona que te invito.`,
    });
  }

  private async send(message: { to: string; subject: string; text: string }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('MAIL_FROM');
    if (!apiKey || !from) return { delivered: false };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, ...message }),
    });

    return { delivered: response.ok };
  }
}
