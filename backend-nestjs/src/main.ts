import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Green Algeria Map API')
    .setDescription(
      'API for tracking reforestation and cleanup efforts across Algeria',
    )
    .setVersion('0.1.0')
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

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  console.log(`Running on http://localhost:${port}`);
  console.log(`API docs at http://localhost:${port}/api/docs`);
}
void bootstrap();
