const requiredProductionVariables = ['DATABASE_URL', 'JWT_SECRET', 'PUBLIC_WEB_URL'];

export function validateEnvironment(config: Record<string, unknown>) {
  const isProduction = config.NODE_ENV === 'production';
  if (isProduction) {
    for (const variable of requiredProductionVariables) {
      if (typeof config[variable] !== 'string' || !String(config[variable]).trim()) {
        throw new Error(`Falta la variable obligatoria ${variable}.`);
      }
    }
    if (String(config.JWT_SECRET).length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres en produccion.');
    }
  }
  return config;
}

export function allowedCorsOrigins(config: Record<string, string | undefined>) {
  return [
    config.PUBLIC_WEB_URL,
    ...(config.CORS_ALLOWED_ORIGINS?.split(',') ?? []),
    ...(config.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001']),
  ]
    .map((origin) => origin?.trim().replace(/\/$/, ''))
    .filter((origin): origin is string => Boolean(origin));
}
