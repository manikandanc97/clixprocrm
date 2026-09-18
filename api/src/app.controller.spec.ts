import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController Health & Readiness', () => {
  let controller: AppController;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should return simple health check OK', () => {
    expect(controller.getHealth()).toBe('OK');
  });

  it('should return liveness UP with uptime', () => {
    const live = controller.getLiveness();
    expect(live.status).toBe('UP');
    expect(live.uptime).toBeGreaterThanOrEqual(0);
    expect(live.timestamp).toBeDefined();
  });

  it('should return readiness UP when database and config are valid', async () => {
    process.env.DATABASE_URL = 'postgresql://usr:pwd@localhost:5432/crm';
    process.env.SUPABASE_URL = 'https://proj.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key-abc';

    const ready = await controller.getReadiness();
    expect(ready.status).toBe('UP');
    expect(ready.checks.database.status).toBe('UP');
    expect(ready.checks.configuration.status).toBe('UP');
  });

  it('should throw 503 SERVICE_UNAVAILABLE when database is down', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('Connection lost'));

    await expect(controller.getReadiness()).rejects.toThrow(HttpException);
    try {
      await controller.getReadiness();
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      const res = err.getResponse();
      expect(res.status).toBe('DOWN');
      expect(res.checks.database.status).toBe('DOWN');
    }
  });
});
