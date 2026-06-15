import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './lib/filters/all-exceptions.filter';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import compress from '@fastify/compress';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const fastifyInstance = Fastify();
  await fastifyInstance.register(multipart);

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : ['http://localhost:3000'];

  await fastifyInstance.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });
  await fastifyInstance.register(compress, { global: true });

  const adapter = new FastifyAdapter(fastifyInstance);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  const enableTransform = process.env.DISABLE_TRANSFORM !== 'true';
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: enableTransform }),
  );
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  const pkgRaw = readFileSync(join(__dirname, '..', 'package.json'), 'utf-8');
  const version: string =
    JSON.parse(pkgRaw) instanceof Object
      ? (JSON.parse(pkgRaw) as { version: string }).version
      : '0.0.0';

  if (process.env.DISABLE_SWAGGER !== 'true') {
    const config = new DocumentBuilder()
      .setTitle('Green Algeria Map API')
      .setDescription(
        'API for tracking reforestation and cleanup efforts across Algeria',
      )
      .setVersion(version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerUiEnabled: false,
    });

    app.use(
      '/api/docs',
      apiReference({
        spec: { content: document },
        theme: 'moon',
      }),
    );
  }

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  logger.log(`Running on http://localhost:${port}`);
  if (process.env.DISABLE_SWAGGER !== 'true') {
    logger.log(`API docs at http://localhost:${port}/api/docs`);
  }
}
void bootstrap();
