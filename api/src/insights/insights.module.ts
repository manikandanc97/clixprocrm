import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRevenueGrowthService } from './services/analytics.revenue-growth.service';
import { AnalyticsInsightsService } from './services/analytics.insights.service';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { AiInsightsController } from './controllers/ai-insights.controller';

@Module({
  controllers: [
    DashboardController,
    AnalyticsController,
    ReportsController,
    AiInsightsController,
  ],
  providers: [
    DashboardService,
    AnalyticsService,
    AnalyticsRevenueGrowthService,
    AnalyticsInsightsService,
    ReportsService,
  ],
  exports: [
    DashboardService,
    AnalyticsService,
    AnalyticsRevenueGrowthService,
    AnalyticsInsightsService,
    ReportsService,
  ],
})
export class InsightsModule {}
