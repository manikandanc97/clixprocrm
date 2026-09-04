import { LeadsImportService } from './leads.import.service';
import { EncryptionService } from '../../common/encryption/encryption.service';

describe('LeadsImportService Suite', () => {
  let service: LeadsImportService;
  let mockPrisma: any;
  let mockTx: any;
  let mockEncService: EncryptionService;
  let mockEntitlementService: any;

  beforeEach(() => {
    mockTx = {
      company: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    mockPrisma = {
      withTenantContext: jest.fn(async (ctx, cb) => cb(mockTx)),
    };

    mockEncService = {
      hash: jest.fn((v) => (v ? `hash_${v}` : v)),
      encrypt: jest.fn((v) => (v ? `enc_${v}` : v)),
      decrypt: jest.fn((v) => (v ? v.replace('enc_', '') : v)),
      encryptWithHash: jest.fn((v) => ({
        encrypted: v ? `enc_${v}` : null,
        hash: v ? `hash_${v}` : null,
      })),
    } as any;

    mockEntitlementService = {
      assertWithinLimit: jest.fn().mockResolvedValue(undefined),
    };

    service = new LeadsImportService(
      mockPrisma as any,
      mockEncService,
      mockEntitlementService,
    );
  });

  it('should return 0 counts when empty leads array is passed', async () => {
    const result = await service.bulkImportLeads('tenant-1', 'usr-1', [], 'skip');
    expect(result).toEqual({ imported: 0, skipped: 0, failed: 0, failedRows: [] });
    expect(mockPrisma.withTenantContext).not.toHaveBeenCalled();
  });

  it('should import valid leads and create companies with encryption and hashing', async () => {
    mockTx.company.findFirst.mockResolvedValue(null);
    mockTx.company.create.mockResolvedValue({ id: 'comp-100' });
    mockTx.lead.findFirst.mockResolvedValue(null);
    mockTx.lead.create.mockResolvedValue({ id: 'lead-100' });
    mockTx.auditLog.create.mockResolvedValue({ id: 'al-100' });

    const leads = [
      {
        name: 'John Doe',
        email: 'john@acme.com',
        company: 'Acme Corp',
        phone: '+1234567890',
        valueAmount: '5000',
        stage: 'QUALIFIED',
        priority: 'HIGH',
      },
    ];

    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'skip');

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);

    // Verify tenant context applied
    expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
      { tenantId: 'tenant-1', userId: 'usr-1' },
      expect.any(Function),
    );

    // Verify company created
    expect(mockTx.company.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        name: 'enc_Acme Corp',
        nameHash: 'hash_Acme Corp',
        ownerId: 'usr-1',
        status: 'ACTIVE',
      },
    });

    // Verify lead created with encryption
    expect(mockTx.lead.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        name: 'enc_John Doe',
        company: 'enc_Acme Corp',
        companyId: 'comp-100',
        email: 'enc_john@acme.com',
        emailHash: 'hash_john@acme.com',
        phone: 'enc_+1234567890',
        value: 5000,
        stage: 'QUALIFIED',
        priority: 'HIGH',
        assignedToId: null,
      },
    });

    // Verify audit log created
    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        userId: 'usr-1',
        action: 'BULK_IMPORT_LEADS',
        module: 'PIPELINE',
        details: { imported: 1, skipped: 0, failed: 0 },
      },
    });
  });

  it('should handle duplicate strategy "skip"', async () => {
    mockTx.lead.findFirst.mockResolvedValue({ id: 'existing-lead-1' });

    const leads = [{ name: 'Existing User', email: 'existing@example.com' }];
    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'skip');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockTx.lead.create).not.toHaveBeenCalled();
    expect(mockTx.lead.update).not.toHaveBeenCalled();
  });

  it('should handle duplicate strategy "update"', async () => {
    mockTx.lead.findFirst.mockResolvedValue({
      id: 'existing-lead-1',
      companyId: 'comp-1',
      assignedToId: 'usr-assigned',
    });
    mockTx.lead.update.mockResolvedValue({ id: 'existing-lead-1' });
    mockTx.auditLog.create.mockResolvedValue({ id: 'al-1' });

    const leads = [
      {
        name: 'Updated User',
        email: 'existing@example.com',
        phone: '+999999999',
        value: 1200,
      },
    ];

    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'update');

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockTx.lead.update).toHaveBeenCalledWith({
      where: { id: 'existing-lead-1' },
      data: expect.objectContaining({
        name: 'enc_Updated User',
        phone: 'enc_+999999999',
        value: 1200,
      }),
    });
  });

  it('should handle duplicate strategy "create" by creating a duplicate lead', async () => {
    mockTx.lead.findFirst.mockResolvedValue({ id: 'existing-lead-1' });
    mockTx.lead.create.mockResolvedValue({ id: 'new-lead-duplicate' });
    mockTx.auditLog.create.mockResolvedValue({ id: 'al-1' });

    const leads = [{ name: 'Duplicated User', email: 'existing@example.com' }];
    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'create');

    expect(result.imported).toBe(1);
    expect(mockTx.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'enc_Duplicated User',
        email: 'enc_existing@example.com',
      }),
    });
  });

  it('should flag rows with missing name or email as failed and capture ErrorReason', async () => {
    const leads = [
      { name: '', email: 'no-name@example.com' },
      { name: 'No Email', email: '' },
    ];

    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'skip');

    expect(result.imported).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.failedRows).toHaveLength(2);
    expect(result.failedRows[0].ErrorReason).toBe('Missing required fields (Name or Email)');
    expect(result.failedRows[1].ErrorReason).toBe('Missing required fields (Name or Email)');
  });

  it('should process large datasets in bounded batches (50 rows per batch)', async () => {
    mockTx.lead.findFirst.mockResolvedValue(null);
    mockTx.lead.create.mockResolvedValue({ id: 'lead-id' });
    mockTx.auditLog.create.mockResolvedValue({ id: 'al-id' });

    // Generate 120 leads (which creates 3 batches: 50, 50, 20)
    const leads = Array.from({ length: 120 }, (_, i) => ({
      name: `Lead ${i + 1}`,
      email: `lead${i + 1}@example.com`,
    }));

    const result = await service.bulkImportLeads('tenant-1', 'usr-1', leads, 'skip');

    expect(result.imported).toBe(120);
    expect(result.failed).toBe(0);
    // 3 batch transactions + 1 audit log transaction = 4 withTenantContext calls
    expect(mockPrisma.withTenantContext).toHaveBeenCalledTimes(4);
  });
});
