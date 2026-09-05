import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConnectionVerifierService } from './connection-verifier.service';

describe('ConnectionVerifierService & SSRF Guard', () => {
  let verifier: ConnectionVerifierService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionVerifierService],
    }).compile();

    verifier = module.get<ConnectionVerifierService>(ConnectionVerifierService);
  });

  describe('assertSafeHost SSRF mitigation', () => {
    it('should reject localhost', async () => {
      await expect(verifier.assertSafeHost('localhost')).rejects.toThrow(BadRequestException);
    });

    it('should reject loopback 127.0.0.1', async () => {
      await expect(verifier.assertSafeHost('127.0.0.1')).rejects.toThrow(BadRequestException);
    });

    it('should reject cloud metadata service 169.254.169.254', async () => {
      await expect(verifier.assertSafeHost('169.254.169.254')).rejects.toThrow(BadRequestException);
    });

    it('should reject private IPv4 ranges (10.0.0.1, 192.168.1.1, 172.16.0.1)', async () => {
      await expect(verifier.assertSafeHost('10.0.0.1')).rejects.toThrow(BadRequestException);
      await expect(verifier.assertSafeHost('192.168.1.1')).rejects.toThrow(BadRequestException);
      await expect(verifier.assertSafeHost('172.16.0.1')).rejects.toThrow(BadRequestException);
    });

    it('should reject internal domain suffixes (.local, .internal, .localhost)', async () => {
      await expect(verifier.assertSafeHost('redis.internal')).rejects.toThrow(BadRequestException);
      await expect(verifier.assertSafeHost('database.local')).rejects.toThrow(BadRequestException);
    });

    it('should accept valid public hosts (e.g. smtp.gmail.com)', async () => {
      await expect(verifier.assertSafeHost('smtp.gmail.com')).resolves.toBeUndefined();
    });
  });
});
