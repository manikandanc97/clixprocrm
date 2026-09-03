import { Test, TestingModule } from '@nestjs/testing';
import { PrismaSeedService } from './prisma-seed.service';
import { PrismaService } from './prisma.service';

describe('PrismaSeedService', () => {
  let service: PrismaSeedService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      waitUntilReady: jest.fn().mockResolvedValue(undefined),
      plan: {
        count: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      aiModel: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      planAiEntitlement: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
      },
      platformConfig: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaSeedService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PrismaSeedService>(PrismaSeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should NOT recreate or upsert plans if database already contains plans (count > 0)', async () => {
    prismaMock.plan.count.mockResolvedValue(3);

    await service.seedCanonicalPlans();

    expect(prismaMock.plan.count).toHaveBeenCalled();
    expect(prismaMock.plan.upsert).not.toHaveBeenCalled();
  });

  it('should seed default plans if database has 0 plans', async () => {
    prismaMock.plan.count.mockResolvedValue(0);
    prismaMock.plan.upsert.mockResolvedValue({ id: 'free' });

    await service.seedCanonicalPlans();

    expect(prismaMock.plan.count).toHaveBeenCalled();
    expect(prismaMock.plan.upsert).toHaveBeenCalledTimes(3);
  });
});
