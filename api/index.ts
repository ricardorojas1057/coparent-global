import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../apps/backend/src/app.module';

let cachedApp: ReturnType<typeof express> | undefined;

async function getApp() {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined,
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  await app.init();

  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(request: Request, response: Response) {
  const app = await getApp();
  return app(request, response);
}
