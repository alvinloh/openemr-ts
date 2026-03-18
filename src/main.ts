import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { AuditService } from './audit/audit.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow inline scripts for DWV viewer
    }),
  );
  app.enableCors();

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global audit interceptor
  const auditService = app.get(AuditService);
  app.useGlobalInterceptors(new AuditInterceptor(auditService));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('OpenEMR-TS')
    .setDescription('Electronic Health Records API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`OpenEMR-TS running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}
bootstrap();
