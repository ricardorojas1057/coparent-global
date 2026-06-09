import { ExpenseCategory, WhatsAppActionType } from '@prisma/client';
import { parseWhatsAppAction } from './whatsapp.parser';

describe('parseWhatsAppAction', () => {
  it('parses a localized expense and detects its category', () => {
    expect(parseWhatsAppAction('Gaste $35.000 en utiles del colegio')).toEqual({
      type: WhatsAppActionType.EXPENSE,
      description: 'Gaste $35.000 en utiles del colegio',
      amount: 35000,
      category: ExpenseCategory.SCHOOL,
    });
  });

  it('parses an expense from an image caption', () => {
    expect(parseWhatsAppAction('12,50 farmacia', true)).toEqual({
      type: WhatsAppActionType.EXPENSE,
      description: '12,50 farmacia',
      amount: 12.5,
      category: ExpenseCategory.HEALTH,
    });
  });

  it('parses a valid calendar command', () => {
    const result = parseWhatsAppAction('CALENDARIO | Mateo | 2026-06-10 18:00 | 2026-06-12 18:00');

    expect(result.type).toBe(WhatsAppActionType.CALENDAR_EVENT);
    if (result.type === WhatsAppActionType.CALENDAR_EVENT) {
      expect(result.childName).toBe('Mateo');
      expect(result.startDate.toISOString()).toContain('2026-06-10');
      expect(result.endDate.toISOString()).toContain('2026-06-12');
    }
  });

  it('keeps invalid or unrecognized input as a note', () => {
    expect(parseWhatsAppAction('Recordar llevar el uniforme')).toEqual({
      type: WhatsAppActionType.NOTE,
      content: 'Recordar llevar el uniforme',
    });
    expect(parseWhatsAppAction('CALENDARIO | Mateo | 2026-06-12 18:00 | 2026-06-10 18:00').type).toBe(
      WhatsAppActionType.NOTE,
    );
  });
});
