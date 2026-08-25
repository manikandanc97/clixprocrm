import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaSeedService } from './prisma-seed.service';

@Global()
@Module({
  providers: [PrismaService, PrismaSeedService],
  exports: [PrismaService, PrismaSeedService],
})
export class PrismaModule {}
