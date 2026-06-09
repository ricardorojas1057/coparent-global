import { ExpenseCategory, WhatsAppActionType } from '@prisma/client';

export type ParsedWhatsAppAction =
  | {
      type: 'EXPENSE';
      description: string;
      amount: number;
      category: ExpenseCategory;
    }
  | {
      type: 'CALENDAR_EVENT';
      childName: string;
      startDate: Date;
      endDate: Date;
    }
  | {
      type: 'NOTE';
      content: string;
    };

function normalizeSearchText(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function parseLocalizedAmount(raw: string) {
  const compact = raw.replace(/\s/g, '');
  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    normalized = compact
      .replace(decimalSeparator === ',' ? /\./g : /,/g, '')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0 || lastDot >= 0) {
    const separator = lastComma >= 0 ? ',' : '.';
    const decimals = compact.length - compact.lastIndexOf(separator) - 1;
    normalized = decimals === 3 ? compact.replace(separator, '') : compact.replace(separator, '.');
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function detectCategory(text: string): ExpenseCategory {
  const normalized = normalizeSearchText(text);
  if (/escuela|colegio|school|libro|uniforme/i.test(normalized)) return ExpenseCategory.SCHOOL;
  if (/salud|medic|farmacia|health|doctor/i.test(normalized)) return ExpenseCategory.HEALTH;
  if (/ropa|calzado|clothing|shoes/i.test(normalized)) return ExpenseCategory.CLOTHING;
  if (/transporte|nafta|taxi|bus|transport/i.test(normalized)) return ExpenseCategory.TRANSPORT;
  if (/comida|alimento|supermercado|food/i.test(normalized)) return ExpenseCategory.FOOD;
  if (/actividad|deporte|club|extracurricular/i.test(normalized)) return ExpenseCategory.EXTRACURRICULAR;
  return ExpenseCategory.OTHER;
}

export function parseWhatsAppAction(text: string, hasImage = false): ParsedWhatsAppAction {
  const trimmed = text.trim();
  const normalized = normalizeSearchText(trimmed);
  const calendar = trimmed.match(/^(?:calendario|calendar)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/i);
  if (calendar) {
    const startDate = new Date(calendar[2].trim().replace(' ', 'T'));
    const endDate = new Date(calendar[3].trim().replace(' ', 'T'));
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate > startDate) {
      return { type: WhatsAppActionType.CALENDAR_EVENT, childName: calendar[1].trim(), startDate, endDate };
    }
  }

  const amountMatch = trimmed.match(/(?:\$|ars|usd|eur|gbp|\u20ac|\u00a3)?\s*(\d[\d.,]*)/i);
  const amount = amountMatch ? parseLocalizedAmount(amountMatch[1]) : undefined;
  if (amount && (/gaste|pague|compre|spent|paid|expense/i.test(normalized) || hasImage)) {
    return {
      type: WhatsAppActionType.EXPENSE,
      description: trimmed || 'Comprobante recibido por WhatsApp',
      amount,
      category: detectCategory(trimmed),
    };
  }

  return { type: WhatsAppActionType.NOTE, content: trimmed || 'Foto recibida por WhatsApp' };
}
