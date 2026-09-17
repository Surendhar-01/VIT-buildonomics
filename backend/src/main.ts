process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limits for resume uploads & document parsing
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin) || origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-role', 'x-dev-user-id'],
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI SkillProof Platform API')
    .setDescription(
      'REST APIs for AI-powered skill verification, sandboxed code execution, portfolio builder, and Ed25519 digital credentialing.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'User onboarding and role-based session management')
    .addTag('Profiles', 'Candidate profile, skill portfolio and evidence tracking')
    .addTag('Portfolios', 'Interactive portfolio builder and public slug views')
    .addTag('Projects', 'Project showcase and GitHub repository verification')
    .addTag('Coding Problems', 'Algorithmic challenges and test case suites')
    .addTag('Code Execution', 'Isolated sandbox runner supporting Python, JS, and Java')
    .addTag('Assessments', 'Timed technical assessments and auto-evaluation')
    .addTag('AI Copilot', 'LLM bio synthesis, code complexity review, and skill gap analysis')
    .addTag('Credentials', 'Ed25519 verifiable credential issuance and revocation')
    .addTag('Public Verification', 'QR and signature verification endpoints')
    .addTag('Recruiters', 'Candidate talent search and shortlisting')
    .addTag('Admin', 'Platform administration and audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  // Detect local network IPv4 address
  let localIp = '127.0.0.1';
  try {
    const os = await import('os');
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
    }
  } catch {}

  logger.log(`Local Access:   http://localhost:${port}/api`);
  logger.log(`Network Access: http://${localIp}:${port}/api`);
  logger.log(`Swagger OpenAPI Documentation: http://${localIp}:${port}/api/docs`);
}

bootstrap();
