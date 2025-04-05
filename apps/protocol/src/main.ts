import { AuthGuard } from './guards/auth.guard';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { CookieInterceptor } from './interceptors/cookie.interceptor';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new CookieInterceptor(configService));
  app.useGlobalGuards(new AuthGuard(configService));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Peso In Blockchain')
    .setDescription('This blockchain api for peso')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-csrf-token',
        in: 'header',
      },
      'csrf-token',
    )
    .build();

  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors({
    origin: 'https://your-frontend.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, x-csrf-token',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
