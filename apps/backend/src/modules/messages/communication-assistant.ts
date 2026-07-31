export type CommunicationReview = {
  needsReview: boolean;
  reasons: string[];
  suggestion: string | null;
};

const hostilePatterns = [
  /\bidiota\b/,
  /\bimbecil\b/,
  /\bestupid[oa]\b/,
  /\binutil\b/,
  /\bmierda\b/,
  /\bforr[oa]s?\b/,
  /\bforr[ei]s?\b/,
  /\bput[ao]s?\b/,
  /\bput[ei]s?\b/,
  /\bhij[oa]\s+de\s+put[ao]\b/,
  /\bhij[oa]\s+de\s+put[aeio]s?\b/,
  /\bputa\s+madre\b/,
  /\bmal\s+parid[ao]\b/,
  /\bmal[ae]s?\s+madres?\b/,
  /\bmal[ao]s?\s+padres?\b/,
  /\bmal\s+madre\b/,
  /\bmal\s+padre\b/,
  /\bbasura\b/,
  /\bpelotud[oa]s?\b/,
  /\bbolud[oa]s?\b/,
  /\btarad[oa]s?\b/,
  /\bsoret[ea]s?\b/,
  /\bconchud[oa]s?\b/,
  /\bcagon[ea]s?\b/,
  /\bdesgraciad[oa]s?\b/,
  /\basqueros[oa]s?\b/,
  /\bhdp\b/,
  /\bshut up\b/,
  /\bidiot\b/,
  /\bstupid\b/,
  /\bmoron\b/,
  /\bdumb\b/,
  /\buseless\b/,
  /\bfuck(?:ing)?\b/,
  /\bpiece of shit\b/,
  /\basshole\b/,
  /\bbitch\b/,
];

const absolutePatterns = [
  /\bsiempre\b/,
  /\bnunca\b/,
  /\btu culpa\b/,
  /\bpor tu culpa\b/,
  /\bno te importa\b/,
  /\bsos un[ao]\b/,
  /\beres un[ao]\b/,
  /\bme tenes cansad[oa]\b/,
  /\bme tienes cansad[oa]\b/,
  /\byour fault\b/,
  /\byou always\b/,
  /\byou never\b/,
  /\byou do not care\b/,
  /\byou don't care\b/,
];

export function reviewCommunication(content: string, locale = 'es-AR'): CommunicationReview {
  const reasons: string[] = [];
  const normalizedContent = normalizeToneText(content);
  const hasHostileLanguage = hostilePatterns.some((pattern) => pattern.test(normalizedContent));

  if (hasHostileLanguage) {
    reasons.push(locale.startsWith('en') ? 'It contains language that may feel hostile.' : 'Contiene lenguaje que puede sentirse hostil.');
  }
  if (absolutePatterns.some((pattern) => pattern.test(normalizedContent))) {
    reasons.push(locale.startsWith('en') ? 'It uses absolute or accusatory wording.' : 'Usa expresiones absolutas o acusatorias.');
  }
  if (content.length > 800) {
    reasons.push(locale.startsWith('en') ? 'A shorter message may be easier to answer.' : 'Un mensaje más breve puede ser más fácil de responder.');
  }

  if (!reasons.length) return { needsReview: false, reasons, suggestion: null };

  const suggestion = locale.startsWith('en')
    ? 'I want to coordinate this for our child\'s wellbeing. Please confirm a concrete option that works for you.'
    : 'Quiero coordinar este tema pensando en el bienestar de nuestros hijos. Por favor, confirmame una alternativa concreta para resolverlo.';

  return { needsReview: true, reasons, suggestion };
}

function normalizeToneText(content: string) {
  return content
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
