import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = parseInt(process.env.PORT ?? '4000', 10);

  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(port);
    logger.log(`🚀 GraphQL server ready at http://localhost:${port}/graphql`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    if (error instanceof Error) {
      logger.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Unhandled error in bootstrap:', err);
  process.exit(1);
});
