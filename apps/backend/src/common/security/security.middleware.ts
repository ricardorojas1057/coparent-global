import { NextFunction, Request, Response } from 'express';

type RateLimitPolicy = {
  methods?: string[];
  path: RegExp;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const policies: RateLimitPolicy[] = [
  { path: /^\/auth\/login$/, methods: ['POST'], limit: 10, windowMs: 60_000 },
  { path: /^\/auth\/register$/, methods: ['POST'], limit: 5, windowMs: 60 * 60_000 },
  { path: /^\/auth\/google$/, methods: ['POST'], limit: 20, windowMs: 60_000 },
  { path: /^\/auth\/password-reset\/request$/, methods: ['POST'], limit: 5, windowMs: 15 * 60_000 },
  { path: /^\/auth\/password-reset\/confirm$/, methods: ['POST'], limit: 10, windowMs: 15 * 60_000 },
  { path: /^\/auth\/email-verification\/request$/, methods: ['POST'], limit: 5, windowMs: 15 * 60_000 },
  { path: /^\/auth\/email-verification\/confirm$/, methods: ['POST'], limit: 10, windowMs: 15 * 60_000 },
  { path: /^\/invitations\/[^/]+$/, methods: ['GET'], limit: 60, windowMs: 60_000 },
  { path: /^\/invitations\/[^/]+\/respond$/, methods: ['POST'], limit: 10, windowMs: 60_000 },
  { path: /^\/expenses\/[^/]+\/receipt-file$/, methods: ['POST'], limit: 10, windowMs: 60_000 },
  { path: /^\/whatsapp\/webhook$/, limit: 180, windowMs: 60_000 },
  { path: /^\/subscriptions\/google-play\/notifications$/, methods: ['POST'], limit: 180, windowMs: 60_000 },
];

export function createSecurityHeadersMiddleware() {
  return (_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader('Cache-Control', 'no-store');
    next();
  };
}
export function createBodySizeGuard(maxBytes = 1_000_000) {
  return (request: Request, response: Response, next: NextFunction) => {
    const effectiveMaxBytes = /^\/expenses\/[^/]+\/receipt-file$/.test(request.path) ? 3_000_000 : maxBytes;
    const declaredLength = Number(request.headers['content-length'] ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > effectiveMaxBytes) {
      response.status(413).json({ statusCode: 413, message: 'La solicitud supera el tamano permitido.' });
      return;
    }
    next();
  };
}

export function createRateLimitMiddleware(now: () => number = Date.now) {
  const entries = new Map<string, RateLimitEntry>();
  let requestsSinceCleanup = 0;

  return (request: Request, response: Response, next: NextFunction) => {
    const policy = policies.find((candidate) => {
      return candidate.path.test(request.path) && (!candidate.methods || candidate.methods.includes(request.method));
    });
    if (!policy) {
      next();
      return;
    }

    const currentTime = now();
    const key = `${request.ip}:${request.method}:${policy.path.source}`;
    const existing = entries.get(key);
    const entry =
      !existing || existing.resetAt <= currentTime
        ? { count: 1, resetAt: currentTime + policy.windowMs }
        : { count: existing.count + 1, resetAt: existing.resetAt };
    entries.set(key, entry);

    response.setHeader('RateLimit-Limit', String(policy.limit));
    response.setHeader('RateLimit-Remaining', String(Math.max(0, policy.limit - entry.count)));
    response.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > policy.limit) {
      response.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))));
      response.status(429).json({
        statusCode: 429,
        message: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
      });
      return;
    }

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 500) {
      requestsSinceCleanup = 0;
      for (const [entryKey, value] of entries) {
        if (value.resetAt <= currentTime) entries.delete(entryKey);
      }
    }
    next();
  };
}
