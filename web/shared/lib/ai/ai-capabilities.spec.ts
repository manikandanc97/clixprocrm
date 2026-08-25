import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_CAPABILITIES,
  hasCapabilityAccess,
  getAuthorizedQuickActions,
  getCapabilityIcon,
  MAX_QUICK_ACTIONS,
} from './ai-capabilities';

describe('CLIXPROCRM AI — Permission-Driven Dynamic Quick Actions (Max 5 Limit)', () => {
  describe('1. Dynamic Quick Action Generation & 5-Item Limit', () => {
    it('ADMIN role generates EXACTLY 5 prioritized CRM quick actions', () => {
      const actions = getAuthorizedQuickActions([], 'ADMIN');
      
      assert.strictEqual(actions.length, 5, 'Must never exceed 5 quick actions');
      
      const labels = actions.map((a) => a.label);

      // Verify exact prioritized 5 actions from example:
      assert.deepStrictEqual(labels, [
        'Show my leads',
        'Hot leads follow-up',
        'Show my customers',
        'Show my pipeline',
        'Show my sales report',
      ]);
    });

    it('Never displays more than 5 suggestions for any role or permission combination', () => {
      const superAdminActions = getAuthorizedQuickActions(['*'], 'SUPER_ADMIN');
      assert.strictEqual(superAdminActions.length, 5);
      assert.deepStrictEqual(
        superAdminActions.map((a) => a.label),
        [
          'Platform overview & MRR',
          'List active organizations',
          'Recent security audit logs',
          'Platform users summary',
          'Subscription plans breakdown',
        ]
      );

      const allPerms = AI_CAPABILITIES.flatMap((c) => c.requiredPermissions);
      const allPermActions = getAuthorizedQuickActions(allPerms, 'STAFF');
      assert.strictEqual(allPermActions.length, 5);
    });

    it('SUPER_ADMIN role gets dedicated platform management quick actions instead of sales CRM actions', () => {
      const superActions = getAuthorizedQuickActions([], 'SUPER_ADMIN');
      assert.strictEqual(superActions.length, 5);

      const labels = superActions.map((a) => a.label);
      assert.ok(labels.includes('Platform overview & MRR'));
      assert.ok(labels.includes('List active organizations'));
      assert.ok(labels.includes('Recent security audit logs'));
      assert.ok(labels.includes('Platform users summary'));
      assert.ok(labels.includes('Subscription plans breakdown'));

      // Must not show irrelevant sales CRM questions to Superadmin
      assert.ok(!labels.includes('Show my leads'));
      assert.ok(!labels.includes('Show my pipeline'));
      assert.ok(!labels.includes('Show my customers'));
    });

    it('SALES with LEADS_READ + CUSTOMERS_READ + DEALS_READ shows top 5 authorized questions only', () => {
      const salesPermissions = ['LEADS_READ', 'CUSTOMERS_READ', 'DEALS_READ'];
      const actions = getAuthorizedQuickActions(salesPermissions, 'SALES');

      assert.strictEqual(actions.length, 5);

      const capabilityIds = actions.map((a) => a.capabilityId);
      const uniqueCaps = Array.from(new Set(capabilityIds));

      assert.deepStrictEqual(uniqueCaps.sort(), ['customers', 'deals', 'leads']);

      const labels = actions.map((a) => a.label);
      // Allowed
      assert.ok(labels.includes('Show my leads'));
      assert.ok(labels.includes('Hot leads follow-up'));
      assert.ok(labels.includes('Show my customers'));
      assert.ok(labels.includes('Show my pipeline'));

      // Forbidden / Hidden (never filled with unauthorized permissions)
      assert.ok(!labels.includes('Show my sales report'), 'Reports must be hidden');
      assert.ok(!labels.includes('Revenue this month'), 'Revenue report must be hidden');
      assert.ok(!labels.includes('Show my pending tasks'), 'Tasks must be hidden');
      assert.ok(!labels.includes('Pending quotations'), 'Quotations must be hidden');
    });

    it('EMPLOYEE with TASKS_READ + CUSTOMERS_READ shows only 4 actions (no filler)', () => {
      const employeePermissions = ['TASKS_READ', 'CUSTOMERS_READ'];
      const actions = getAuthorizedQuickActions(employeePermissions, 'EMPLOYEE');

      assert.strictEqual(actions.length, 4, 'Must show only the 4 authorized actions without filler');

      const labels = actions.map((a) => a.label);
      const capabilityIds = Array.from(new Set(actions.map((a) => a.capabilityId)));

      assert.deepStrictEqual(capabilityIds.sort(), ['customers', 'tasks']);

      // Allowed
      assert.ok(labels.includes('Show my customers'));
      assert.ok(labels.includes('Find recent customers'));
      assert.ok(labels.includes('Show my pending tasks'));
      assert.ok(labels.includes('Tasks due today'));

      // Forbidden / Hidden
      assert.ok(!labels.includes('Show my leads'), 'Leads must be hidden');
      assert.ok(!labels.includes('Show my pipeline'), 'Deals must be hidden');
      assert.ok(!labels.includes('Show my sales report'), 'Reports must be hidden');
      assert.ok(!labels.includes('Pending quotations'), 'Quotations must be hidden');
    });

    it('User with only 1 capability shows only 2 actions', () => {
      const actions = getAuthorizedQuickActions(['tasks.read'], 'STAFF');
      assert.strictEqual(actions.length, 2);
      assert.deepStrictEqual(actions.map((a) => a.label), ['Show my pending tasks', 'Tasks due today']);
    });
  });

  describe('2. Missing Permissions & Zero-Permission Graceful Handling', () => {
    it('User with NO permissions produces an empty action list (triggers fallback prompt)', () => {
      const actions = getAuthorizedQuickActions([], 'CUSTOM_GUEST');
      assert.strictEqual(actions.length, 0, 'No permissions should return empty actions');
    });

    it('User with undefined/null permissions produces an empty action list', () => {
      const actions = getAuthorizedQuickActions(undefined, 'EMPLOYEE');
      assert.strictEqual(actions.length, 0);
    });

    it('Missing a single permission specifically omits only that capability', () => {
      // User has everything EXCEPT reports and quotations
      const permissions = ['leads.read', 'customers.read', 'deals.read', 'tasks.read'];
      const actions = getAuthorizedQuickActions(permissions, 'MANAGER');

      assert.strictEqual(actions.length, 5);
      const capabilityIds = new Set(actions.map((a) => a.capabilityId));
      assert.ok(capabilityIds.has('leads'));
      assert.ok(capabilityIds.has('customers'));
      assert.ok(capabilityIds.has('deals'));
      assert.ok(capabilityIds.has('tasks'));
      assert.ok(!capabilityIds.has('reports'), 'Reports capability must not be authorized');
      assert.ok(!capabilityIds.has('quotations'), 'Quotations capability must not be authorized');
    });
  });

  describe('3. Permission Format & Synonyms Normalization', () => {
    it('Handles canonical backend DB module names (e.g. Leads, Customers, Reports & Analytics)', () => {
      const backendPermissions = ['Leads', 'Customers', 'Reports & Analytics'];
      const actions = getAuthorizedQuickActions(backendPermissions, 'STAFF');

      assert.ok(actions.length <= 5);
      const capabilityIds = Array.from(new Set(actions.map((a) => a.capabilityId)));
      assert.deepStrictEqual(capabilityIds.sort(), ['customers', 'leads', 'reports']);
    });

    it('Handles dot notation permissions (e.g. leads.read, deals.read_assigned)', () => {
      const dotPermissions = ['leads.read', 'deals.read_assigned'];
      const actions = getAuthorizedQuickActions(dotPermissions, 'SALES');

      assert.ok(actions.length <= 5);
      const capabilityIds = Array.from(new Set(actions.map((a) => a.capabilityId)));
      assert.deepStrictEqual(capabilityIds.sort(), ['deals', 'leads']);
    });

    it('Handles wildcard grants (ALL, *) capped at 5', () => {
      const wildcardActions = getAuthorizedQuickActions(['ALL'], 'CUSTOM_AUDITOR');
      assert.strictEqual(wildcardActions.length, 5);
    });
  });

  describe('4. Security Boundary & Anti-Spoofing', () => {
    it('Does not allow arbitrary unknown permissions to grant access', () => {
      const spoofedPermissions = ['SUPERUSER', 'INJECT_ALL', 'UNAUTHORIZED_MODULE'];
      const actions = getAuthorizedQuickActions(spoofedPermissions, 'EMPLOYEE');
      assert.strictEqual(actions.length, 0, 'Spoofed permissions must not match any capability');
    });

    it('Correctly resolves Lucide icons for all registered capabilities', () => {
      for (const capability of AI_CAPABILITIES) {
        const icon = getCapabilityIcon(capability.iconName);
        assert.ok(icon, `Capability ${capability.id} must have a valid icon component`);
      }
    });
  });
});
