export type CommunicationReview = {
  needsReview: boolean;
  reasons: string[];
  suggestion: string | null;
};

const hostilePatterns = [
  /\bidiota\b/i,
  /\bimbecil\b/i,
  /\bestupid[oa]\b/i,
  /\binutil\b/i,
  /\bshut up\b/i,
  /\bidiot\b/i,
  /\bstupid\b/i,
];

const absolutePatterns = [
  /\bsiempre\b/i,
  /\bnunca\b/i,
  /\btu culpa\b/i,
  /\byour fault\b/i,
  /\byou always\b/i,
  /\byou never\b/i,
];

export function reviewCommunication(content: string, locale = 'es-AR'): CommunicationReview {
  const reasons: string[] = [];
  if (hostilePatterns.some((pattern) => pattern.test(content))) {
    reasons.push(locale.startsWith('en') ? 'It contains language that may feel hostile.' : 'Contiene lenguaje que puede sentirse hostil.');
  }
  if (absolutePatterns.some((pattern) => pattern.test(content))) {
    reasons.push(locale.startsWith('en') ? 'It uses absolute or accusatory wording.' : 'Usa expresiones absolutas o acusatorias.');
  }
  if (content.length > 800) {
    reasons.push(locale.startsWith('en') ? 'A shorter message may be easier to answer.' : 'Un mensaje mas breve puede ser mas facil de responder.');
  }

  if (!reasons.length) return { needsReview: false, reasons, suggestion: null };

  const cleaned = content
    .replace(new RegExp(hostilePatterns.map((pattern) => pattern.source).join('|'), 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const suggestion = locale.startsWith('en')
    ? `I would like to coordinate this for our child's wellbeing: ${cleaned}. Please confirm what option works for you.`
    : `Quiero coordinar este tema pensando en el bienestar de nuestros hijos: ${cleaned}. Por favor, confirma que opcion te resulta posible.`;

  return { needsReview: true, reasons, suggestion };
}
