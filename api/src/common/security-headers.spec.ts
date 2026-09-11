import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class TestHealthController {
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [TestHealthController],
})
class TestModule {}

describe('Security Headers - @fastify/helmet Registration', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // Register helmet exactly as configured in main.ts
    await app.register(require('@fastify/helmet'), {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'https:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'sameorigin',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('P2: Emits HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy headers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const headers = response.headers;
    // HSTS header
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    // X-Content-Type-Options header
    expect(headers['x-content-type-options']).toBe('nosniff');
    // X-Frame-Options header
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    // Referrer-Policy header
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // Content-Security-Policy header
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    // Cross-Origin-Resource-Policy header
    expect(headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});
