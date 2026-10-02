import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PlatformDashboardService } from '../src/super-admin/services/platform-dashboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(PlatformDashboardService);

  console.log('Running getPlatformOverview()...');
  
  // Warm up first
  await service.getPlatformOverview();
  console.log('--- WARM UP DONE ---');
  
  // Measure
  await service.getPlatformOverview();
  console.log('--- MEASUREMENT DONE ---');

  await app.close();
}

bootstrap();
