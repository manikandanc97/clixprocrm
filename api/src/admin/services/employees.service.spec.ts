import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockSupabaseAdmin = {
  createUser: jest.fn(),
  listUsers: jest.fn(),
  updateUserById: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: mockSupabaseAdmin,
    },
  })),
}));

describe('EmployeesService Security - Account Takeover Prevention', () => {
  let service: EmployeesService;
  let prismaMock: any;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

    prismaMock = {
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 'role-1', name: 'SALES' }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'role-1', name: 'SALES' }),
      },
      tenantUser: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'tu-1' }),
        update: jest.fn(),
      },
      invitation: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({
          id: 'inv-1',
          email: 'existing-user@example.com',
          createdAt: new Date(),
        }),
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) => ({
          id: where?.id || data?.id || 'mock-user-id',
          name: data?.name || 'Mock User',
          email: 'existing-user@example.com',
        })),
      },
      department: {
        findFirst: jest.fn(),
      },
      withTenantContext: jest
        .fn()
        .mockImplementation((ctx, cb) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://mock.supabase.co';
              if (key === 'SUPABASE_SERVICE_ROLE_KEY')
                return 'mock-service-role-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.clearAllMocks();
  });

  it('CRITICAL: NEVER overwrites or resets password when inviting an existing Supabase user', async () => {
    // Simulate Supabase returning user already registered (422)
    mockSupabaseAdmin.createUser.mockResolvedValue({
      data: null,
      error: {
        message: 'A user with this email address has already been registered',
        status: 422,
      },
    });

    mockSupabaseAdmin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'existing-supabase-uuid', email: 'existing-user@example.com' },
        ],
      },
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-supabase-uuid',
      email: 'existing-user@example.com',
      name: 'Existing Account Owner',
    });

    const result = await service.inviteEmployee(
      'tenant-b-id',
      'existing-user@example.com',
      'SALES',
      'Existing User',
      'some-new-password123',
    );

    // Verify updateUserById (which overwrote passwords previously) is NEVER called
    expect(mockSupabaseAdmin.updateUserById).not.toHaveBeenCalled();

    // Verify temporaryPassword is NOT returned in response
    expect((result as any).temporaryPassword).toBeUndefined();
    expect(result.email).toBe('existing-user@example.com');
  });

  it('CRITICAL: Never leaks temporaryPassword in response for new user creations', async () => {
    mockSupabaseAdmin.createUser.mockResolvedValue({
      data: {
        user: { id: 'new-supabase-uuid', email: 'new-hire@example.com' },
      },
      error: null,
    });

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'new-supabase-uuid',
      email: 'new-hire@example.com',
      name: 'New Hire',
    });

    const result = await service.inviteEmployee(
      'tenant-a-id',
      'new-hire@example.com',
      'SALES',
      'New Hire',
      'temp-password-abc',
    );

    expect((result as any).temporaryPassword).toBeUndefined();
    expect(result.inviteToken).toBeDefined();

    // Verify token stored in DB is SHA-256 hashed and not the raw token
    expect(prismaMock.invitation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          token: expect.not.stringMatching(result.inviteToken),
        }),
      }),
    );
  });

  it('P2: Stores SHA-256 hash of invitation token in database', async () => {
    mockSupabaseAdmin.createUser.mockResolvedValue({
      data: {
        user: { id: 'hashed-test-uuid', email: 'hash-test@example.com' },
      },
      error: null,
    });

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'hashed-test-uuid',
      email: 'hash-test@example.com',
      name: 'Hash Test',
    });

    const result = await service.inviteEmployee(
      'tenant-a-id',
      'hash-test@example.com',
      'SALES',
      'Hash Test',
    );

    const upsertCall = prismaMock.invitation.upsert.mock.calls[0][0];
    const storedToken = upsertCall.create.token;

    // Hashed token is 64 hex characters (SHA-256)
    expect(storedToken).toHaveLength(64);
    // Stored token is NOT the raw token returned to the user
    expect(storedToken).not.toBe(result.inviteToken);
  });
});
