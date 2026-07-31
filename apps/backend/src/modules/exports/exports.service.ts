import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExpenseStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type ExportLanguage = 'es' | 'en';

type ExportFamily = Awaited<ReturnType<ExportsService['loadFamilyForExport']>>;

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async basicFamilyHtml(familyId: string, userId: string, language: ExportLanguage = 'es') {
    const family = await this.loadFamilyForExport(familyId, userId);
    if (!family) {
      throw new ForbiddenException('No integras esta familia.');
    }

    const generatedAt = new Date();
    const html = this.renderHtml(family, generatedAt, language);
    const text = this.renderText(family, generatedAt, language);
    const digest = crypto.createHash('sha256').update(html).digest('hex');

    await this.audit.log({
      userId,
      familyId,
      action: 'EXPORT_BASIC_FAMILY_HTML',
      entity: 'Family',
      entityId: familyId,
      metadata: { digest, format: 'HTML', language },
    });

    return {
      manifest: {
        version: 1,
        type: 'BASIC_FAMILY_HTML',
        generatedAt: generatedAt.toISOString(),
        algorithm: 'SHA-256',
        digest,
        notice: this.copy(language).notice,
      },
      fileName: this.fileName(family.tenant.name, generatedAt),
      mimeType: 'text/html',
      html,
      text,
    };
  }

  private loadFamilyForExport(familyId: string, userId: string) {
    return this.prisma.family.findFirst({
      where: { id: familyId, members: { some: { userId } } },
      include: {
        tenant: { select: { name: true } },
        settings: true,
        members: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        children: {
          include: {
            calendarEvents: {
              include: {
                currentParent: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { startDate: 'asc' },
              take: 200,
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        expenses: {
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } },
            allocations: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
              orderBy: { updatedAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        },
        chatMessages: {
          where: { isDeleted: false },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        },
      },
    });
  }

  private renderHtml(family: NonNullable<ExportFamily>, generatedAt: Date, language: ExportLanguage) {
    const copy = this.copy(language);
    const currency = family.settings?.currency ?? 'ARS';
    const balances = this.balances(family);
    const events = family.children.flatMap((child) =>
      child.calendarEvents.map((event) => ({ ...event, childName: `${child.firstName} ${child.lastName}`.trim() })),
    );

    return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${this.escape(copy.title)} - ${this.escape(family.tenant.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #172033; margin: 24px; line-height: 1.45; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 28px 0 10px; font-size: 18px; color: #0f766e; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 18px; }
    th, td { border: 1px solid #d7dee8; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef4f8; }
    .notice { background: #fff7ed; border: 1px solid #fed7aa; padding: 12px; border-radius: 8px; margin: 16px 0; }
    .muted { color: #637083; }
    .hash { word-break: break-all; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${this.escape(copy.title)}</h1>
  <p class="muted">${this.escape(copy.generatedAt)}: ${this.escape(this.formatDateTime(generatedAt))}</p>
  <p><strong>${this.escape(copy.family)}:</strong> ${this.escape(family.tenant.name)}</p>
  <p><strong>${this.escape(copy.children)}:</strong> ${this.escape(family.children.map((child) => child.firstName).join(', ') || copy.none)}</p>
  <div class="notice">${this.escape(copy.notice)}</div>

  <h2>${this.escape(copy.members)}</h2>
  ${this.table(
    [copy.name, copy.email, copy.role],
    family.members.map((member) => [
      this.fullName(member.user),
      member.user.email,
      member.role,
    ]),
    copy.none,
  )}

  <h2>${this.escape(copy.calendar)}</h2>
  ${this.table(
    [copy.date, copy.event, copy.child, copy.responsible, copy.status],
    events.map((event) => [
      `${this.formatDateTime(event.startDate)} - ${this.formatDateTime(event.endDate)}`,
      `${event.title} (${event.type})`,
      event.childName,
      this.fullName(event.currentParent),
      event.status,
    ]),
    copy.noEvents,
  )}

  <h2>${this.escape(copy.expenses)}</h2>
  ${this.table(
    [copy.date, copy.description, copy.amount, copy.paidBy, copy.status],
    family.expenses.map((expense) => [
      this.formatDateTime(expense.createdAt),
      `${expense.description} (${expense.category})`,
      this.formatMoney(Number(expense.amount), currency),
      this.fullName(expense.payer),
      this.expenseStatus(expense, language),
    ]),
    copy.noExpenses,
  )}

  <h2>${this.escape(copy.balances)}</h2>
  ${this.table(
    [copy.name, copy.paid, copy.owes, copy.receivable, copy.net],
    balances.map((balance) => [
      balance.name,
      this.formatMoney(balance.paid, currency),
      this.formatMoney(balance.owes, currency),
      this.formatMoney(balance.receivable, currency),
      this.formatMoney(balance.net, currency),
    ]),
    copy.none,
  )}

  <h2>${this.escape(copy.messages)}</h2>
  ${this.table(
    [copy.date, copy.sender, copy.category, copy.message],
    family.chatMessages.map((message) => [
      this.formatDateTime(message.createdAt),
      this.fullName(message.sender),
      message.category,
      message.content,
    ]),
    copy.noMessages,
  )}

  <h2>${this.escape(copy.integrity)}</h2>
  <p class="muted">${this.escape(copy.hashHelp)}</p>
</body>
</html>`;
  }

  private renderText(family: NonNullable<ExportFamily>, generatedAt: Date, language: ExportLanguage) {
    const copy = this.copy(language);
    const currency = family.settings?.currency ?? 'ARS';
    const balances = this.balances(family);
    const events = family.children.flatMap((child) =>
      child.calendarEvents.map((event) => ({ ...event, childName: `${child.firstName} ${child.lastName}`.trim() })),
    );

    return [
      copy.title,
      `${copy.generatedAt}: ${this.formatDateTime(generatedAt)}`,
      `${copy.family}: ${family.tenant.name}`,
      copy.notice,
      '',
      copy.calendar,
      ...events.map((event) => `- ${this.formatDateTime(event.startDate)} | ${event.title} | ${event.childName} | ${this.fullName(event.currentParent)}`),
      events.length ? '' : `- ${copy.noEvents}`,
      '',
      copy.expenses,
      ...family.expenses.map((expense) => `- ${this.formatDateTime(expense.createdAt)} | ${expense.description} | ${this.formatMoney(Number(expense.amount), currency)} | ${this.fullName(expense.payer)}`),
      family.expenses.length ? '' : `- ${copy.noExpenses}`,
      '',
      copy.balances,
      ...balances.map((balance) => `- ${balance.name}: ${copy.net} ${this.formatMoney(balance.net, currency)}`),
      '',
      copy.messages,
      ...family.chatMessages.map((message) => `- ${this.formatDateTime(message.createdAt)} | ${this.fullName(message.sender)}: ${message.content}`),
      family.chatMessages.length ? '' : `- ${copy.noMessages}`,
    ].join('\n');
  }

  private balances(family: NonNullable<ExportFamily>) {
    return family.members.map((member) => {
      let paid = 0;
      let owes = 0;
      let receivable = 0;

      for (const expense of family.expenses) {
        if (expense.paidById === member.userId) {
          paid += Number(expense.amount);
        }
        for (const allocation of expense.allocations) {
          if (allocation.userId === expense.paidById || allocation.status === ExpenseStatus.PAID) {
            continue;
          }
          const amount = Number(allocation.amountDue);
          if (allocation.userId === member.userId) {
            owes += amount;
          }
          if (expense.paidById === member.userId) {
            receivable += amount;
          }
        }
      }

      return {
        name: this.fullName(member.user),
        paid: this.round(paid),
        owes: this.round(owes),
        receivable: this.round(receivable),
        net: this.round(receivable - owes),
      };
    });
  }

  private table(headers: string[], rows: string[][], emptyText: string) {
    if (!rows.length) {
      return `<p class="muted">${this.escape(emptyText)}</p>`;
    }
    return `<table><thead><tr>${headers.map((header) => `<th>${this.escape(header)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${this.escape(cell)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
  }

  private expenseStatus(expense: NonNullable<ExportFamily>['expenses'][number], language: ExportLanguage) {
    const pending = expense.allocations.filter(
      (allocation) => allocation.userId !== expense.paidById && allocation.status !== ExpenseStatus.PAID,
    );
    if (language === 'en') {
      return pending.length ? `${pending.length} pending` : 'settled';
    }
    return pending.length ? `${pending.length} pendiente(s)` : 'saldado';
  }

  private copy(language: ExportLanguage) {
    if (language === 'en') {
      return {
        title: 'Coparent Global basic family export',
        generatedAt: 'Generated at',
        family: 'Family',
        children: 'Children',
        members: 'Members',
        name: 'Name',
        email: 'Email',
        role: 'Role',
        calendar: 'Calendar',
        date: 'Date',
        event: 'Event',
        child: 'Child',
        responsible: 'Responsible parent',
        status: 'Status',
        expenses: 'Expenses',
        description: 'Description',
        amount: 'Amount',
        paidBy: 'Paid by',
        balances: 'Balances',
        paid: 'Paid',
        owes: 'Owes',
        receivable: 'Receivable',
        net: 'Net',
        messages: 'Messages',
        sender: 'Sender',
        category: 'Category',
        message: 'Message',
        integrity: 'Integrity',
        hashHelp: 'The SHA-256 digest is returned in the export manifest. Basic exports are operational summaries.',
        notice:
          'This is a basic operational family summary. It is not a universal legal certificate and should not be interpreted as legal advice.',
        none: 'None',
        noEvents: 'No calendar events recorded.',
        noExpenses: 'No expenses recorded.',
        noMessages: 'No family messages recorded.',
      };
    }

    return {
      title: 'Coparent Global - exportacion familiar basica',
      generatedAt: 'Generado',
      family: 'Familia',
      children: 'Hijos/as',
      members: 'Integrantes',
      name: 'Nombre',
      email: 'Email',
      role: 'Rol',
      calendar: 'Calendario',
      date: 'Fecha',
      event: 'Evento',
      child: 'Hijo/a',
      responsible: 'Progenitor responsable',
      status: 'Estado',
      expenses: 'Gastos',
      description: 'Descripcion',
      amount: 'Importe',
      paidBy: 'Pago',
      balances: 'Saldos',
      paid: 'Pago total',
      owes: 'Debe',
      receivable: 'Por cobrar',
      net: 'Neto',
      messages: 'Mensajes',
      sender: 'Remitente',
      category: 'Categoria',
      message: 'Mensaje',
      integrity: 'Integridad',
      hashHelp: 'El hash SHA-256 se devuelve en el manifiesto de la exportacion. Los resumenes basicos son operativos.',
      notice:
        'Este es un resumen operativo familiar basico. No constituye una constancia legal universal y no debe interpretarse como asesoramiento legal.',
      none: 'Ninguno',
      noEvents: 'No hay eventos registrados.',
      noExpenses: 'No hay gastos registrados.',
      noMessages: 'No hay mensajes familiares registrados.',
    };
  }

  private fullName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private fileName(familyName: string, generatedAt: Date) {
    const date = generatedAt.toISOString().slice(0, 10);
    const safeFamilyName = familyName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return `coparent-global-${safeFamilyName || 'familia'}-${date}.html`;
  }

  private formatDateTime(value: Date | string) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }

  private formatMoney(value: number, currency: string) {
    return `${currency} ${this.round(value).toFixed(2)}`;
  }

  private round(value: number) {
    return Number(value.toFixed(2));
  }

  private escape(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
