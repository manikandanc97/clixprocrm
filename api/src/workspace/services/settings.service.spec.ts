import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from './settings.service';

describe('SettingsService - Tenant-Scoped AI Configuration & BYOK Encryption', () => {
  let service: SettingsService;
  let prismaMock: any;
  let encryptionMock: any;

  beforeEach(async () => {
    prismaMock = {
      tenantAiConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      withTenantContext: jest
        .fn()
        .mockImplementation((ctx, cb) => cb(prismaMock)),
    };

    encryptionMock = {
      encrypt: jest.fn((val) => (val ? `aes256gcm_encrypted_${val}` : null)),
      decrypt: jest.fn((val) =>
        val && val.startsWith('aes256gcm_encrypted_')
          ? val.replace('aes256gcm_encrypted_', '')
          : val,
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EncryptionService, useValue: encryptionMock },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('HIGH: Reads AI settings scoped strictly to the authenticated tenantId', async () => {
    prismaMock.tenantAiConfig.findUnique.mockResolvedValue({
      tenantId: 'tenant-123',
      provider: 'gemini',
      model: 'gemini-3.6-flash',
      isAiEnabled: true,
      useRag: false,
      useTools: true,
      apiKey: null,
    });

    const result = await service.getAiSettings('tenant-123');

    expect(prismaMock.tenantAiConfig.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123' },
    });
    expect(result.isAiEnabled).toBe(true);
    expect(result.useRag).toBe(false);
  });

  it('HIGH: Encrypts Bring-Your-Own-Key API key with AES-256-GCM before DB write', async () => {
    prismaMock.tenantAiConfig.upsert.mockResolvedValue({
      tenantId: 'tenant-abc',
      apiKey: 'aes256gcm_encrypted_AIzaSySecretApiKey12345',
      isAiEnabled: true,
      useRag: true,
    });

    prismaMock.tenantAiConfig.findUnique.mockResolvedValue({
      tenantId: 'tenant-abc',
      apiKey: 'aes256gcm_encrypted_AIzaSySecretApiKey12345',
      isAiEnabled: true,
      useRag: true,
    });

    await service.updateAiSettings('tenant-abc', {
      apiKey: 'AIzaSySecretApiKey12345',
      isAiEnabled: true,
    });

    expect(encryptionMock.encrypt).toHaveBeenCalledWith(
      'AIzaSySecretApiKey12345',
    );
    expect(prismaMock.tenantAiConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-abc' },
        update: expect.objectContaining({
          apiKey: 'aes256gcm_encrypted_AIzaSySecretApiKey12345',
        }),
      }),
    );
  });

  it('HIGH: NEVER returns the decrypted API key to the frontend/API response', async () => {
    prismaMock.tenantAiConfig.findUnique.mockResolvedValue({
      tenantId: 'tenant-abc',
      apiKey: 'aes256gcm_encrypted_AIzaSySecretApiKey12345',
      isAiEnabled: true,
      useRag: true,
    });

    const result = await service.getAiSettings('tenant-abc');

    expect(result.hasCustomApiKey).toBe(true);
    expect(result.apiKeyMasked).toBe('••••••••••••••••');
    expect((result as any).apiKey).toBeUndefined();
  });
});
