import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../apps/backend/src/app.module';
import { configureApp } from '../apps/backend/src/common/config/configure-app';

let cachedApp: ReturnType<typeof express> | undefined;

async function getApp() {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined,
    rawBody: true,
  });
  configureApp(app);
  await app.init();

  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(request: Request, response: Response) {
  const app = await getApp();
  return app(request, response);
}
