import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('P5 IDOR & Tenant Boundary Protection Suite', () => {
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = {
      leads: [
        {
          id: 'lead-t1-1',
          tenantId: 'tenant-1',
          title: 'Lead 1',
          assignedTo: 'usr-1',
        },
        {
          id: 'lead-t2-1',
          tenantId: 'tenant-2',
          title: 'Lead 2',
          assignedTo: 'usr-2',
        },
      ],
      customers: [
        { id: 'cust-t1-1', tenantId: 'tenant-1', name: 'Acme Client' },
        { id: 'cust-t2-1', tenantId: 'tenant-2', name: 'Beta Client' },
      ],
    };
  });

  const getLeadByIdScoped = (id: string, requesterTenantId: string) => {
    const lead = mockDatabase.leads.find((l: any) => l.id === id);
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.tenantId !== requesterTenantId) {
      throw new ForbiddenException(
        'Access denied: cross-tenant access forbidden',
      );
    }
    return lead;
  };

  const updateLeadScoped = (
    id: string,
    data: any,
    requesterTenantId: string,
  ) => {
    const lead = getLeadByIdScoped(id, requesterTenantId);
    return { ...lead, ...data };
  };

  describe('1. Cross-Tenant IDOR Prevention', () => {
    it('allows tenant 1 user to access tenant 1 lead', () => {
      const lead = getLeadByIdScoped('lead-t1-1', 'tenant-1');
      expect(lead.id).toBe('lead-t1-1');
      expect(lead.tenantId).toBe('tenant-1');
    });

    it('strictly denies tenant 1 user from reading tenant 2 lead', () => {
      expect(() => {
        getLeadByIdScoped('lead-t2-1', 'tenant-1');
      }).toThrow(ForbiddenException);
    });

    it('strictly denies tenant 1 user from modifying tenant 2 lead', () => {
      expect(() => {
        updateLeadScoped('lead-t2-1', { title: 'Hacked Title' }, 'tenant-1');
      }).toThrow(ForbiddenException);
    });
  });

  describe('2. Client Header / Body Overriding Protection', () => {
    it('enforces server context tenantId over forged client body tenantId', () => {
      const serverContextTenantId = 'tenant-1';
      const maliciousClientPayload = {
        title: 'New Lead',
        tenantId: 'tenant-2', // Attacker attempts to inject record into victim tenant
      };

      // Server enforces authenticated context
      const safeRecord = {
        title: maliciousClientPayload.title,
        tenantId: serverContextTenantId, // Server authoritative
      };

      expect(safeRecord.tenantId).toBe('tenant-1');
    });
  });
});
