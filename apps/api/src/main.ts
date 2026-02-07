import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Apply Global Pipes
    app.useGlobalPipes(new ZodValidationPipe());

    // Prefix all routes with /api
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 API is running on: http://localhost:${port}/api`);
}

bootstrap();
