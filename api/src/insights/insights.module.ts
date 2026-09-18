import { Module } from '@nestjs/common';
import { AiInsightsController } from './controllers/ai-insights.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ReportsController } from './controllers/reports.controller';
import { AnalyticsInsightsService } from './services/analytics.insights.service';
import { AnalyticsRevenueGrowthService } from './services/analytics.revenue-growth.service';
import { AnalyticsService } from './services/analytics.service';
import { DashboardService } from './services/dashboard.service';
import { ReportsService } from './services/reports.service';

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
