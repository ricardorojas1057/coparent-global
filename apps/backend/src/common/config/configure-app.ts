import { INestApplication, ValidationPipe } from '@nestjs/common';
import { allowedCorsOrigins } from './environment';
import {
  createBodySizeGuard,
  createRateLimitMiddleware,
  createSecurityHeadersMiddleware,
} from '../security/security.middleware';

export function configureApp(app: INestApplication) {
  const express = app.getHttpAdapter().getInstance();
  express.set('trust proxy', 1);
  app.use(createSecurityHeadersMiddleware());
  app.use(createBodySizeGuard());
  app.use(createRateLimitMiddleware());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  const origins = allowedCorsOrigins(process.env);
  app.enableCors({
    origin: origins.length ? origins : false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Idempotency-Key'],
    maxAge: 600,
  });
}
