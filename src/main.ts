import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'
import { GraphService } from './graph/graph.service';
dotenv.config();
async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const graphService = app.get(GraphService);
  try {
    await graphService.initGraphClient(); // ודא שה־client מוכן
    await graphService.createSubscription();
    console.log('Graph subscription created successfully!');
  } catch (error) {
    console.error('Failed to create Graph subscription:', error);
  }
}
bootstrap();
