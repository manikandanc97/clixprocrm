import { MatrixCategory, PlanDefinition } from './plan-definitions.constant';

/**
 * Dynamically constructs the Feature Comparison Matrix from the live canonical plans.
 */
export function buildDynamicComparisonMatrix(
  plans: PlanDefinition[],
): MatrixCategory[] {
  const sortedPlans = [...plans].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  );

  const checkPlanFeature = (p: PlanDefinition, keywords: string[]): boolean => {
    const featStr = (p.features || []).join(' ').toLowerCase();
    return keywords.some((kw) => featStr.includes(kw.toLowerCase()));
  };

  return [
    {
      category: 'CRM & Capacity',
      features: [
        {
          key: 'contacts_leads',
          name: 'Contacts & Leads Capacity',
          description: 'Max records stored in workspace',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              `${p.limits.maxContacts === -1 ? 'Unlimited' : p.limits.maxContacts.toLocaleString()} / ${p.limits.maxLeads === -1 ? 'Unlimited' : p.limits.maxLeads.toLocaleString()}`,
            ]),
          ),
        },
        {
          key: 'tasks_capacity',
          name: 'Tasks Capacity',
          description: 'Active assigned tasks and checklists',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.limits.maxTasks === -1
                ? 'Unlimited'
                : p.limits.maxTasks.toLocaleString(),
            ]),
          ),
        },
        {
          key: 'deal_pipelines',
          name: 'Deals & Pipelines',
          description: 'Opportunity tracking and stages',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.limits.maxPipelines === -1
                ? 'Unlimited'
                : p.limits.maxPipelines === 1
                  ? '1 Pipeline'
                  : `${p.limits.maxPipelines} Pipelines`,
            ]),
          ),
        },
        {
          key: 'custom_fields',
          name: 'Custom Fields',
          description: 'Tailor schemas to your business',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.limits.maxCustomFields === -1
                ? 'Unlimited'
                : `Up to ${p.limits.maxCustomFields}`,
            ]),
          ),
        },
      ],
    },
    {
      category: 'Automation & Workflows',
      features: [
        {
          key: 'workflow_rules',
          name: 'Automation & Workflows',
          description: 'Trigger stage shifts and automated tasks',
          values: Object.fromEntries(
            sortedPlans.map((p) => {
              if (p.limits.maxAutomations === -1)
                return [p.id, 'Unlimited Workflows'];
              if (p.limits.maxAutomations && p.limits.maxAutomations > 1) {
                return [
                  p.id,
                  `Advanced Automation (${p.limits.maxAutomations} workflows)`,
                ];
              }
              return [
                p.id,
                p.id === 'free' ? 'Limited Automation' : 'Basic Automation',
              ];
            }),
          ),
        },
        {
          key: 'pipeline_customization',
          name: 'Sales Pipeline Customization',
          description: 'Custom stages, probabilities, and funnels',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id !== 'free' ||
                checkPlanFeature(p, [
                  'pipeline custom',
                  'custom pipeline',
                  'sales pipeline',
                ]),
            ]),
          ),
        },
      ],
    },
    {
      category: 'Communication & Email',
      features: [
        {
          key: 'email_integration',
          name: 'Email Integration & Tracking',
          description: 'Direct email sync, tracking and activity logging',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'free' ? 'Limited Email' : 'Full Email Sync & Tracking',
            ]),
          ),
        },
        {
          key: 'saved_views',
          name: 'Saved Views & Filters',
          description: 'Custom filters and quick list views',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id !== 'free' ||
                checkPlanFeature(p, ['saved views', 'saved view']),
            ]),
          ),
        },
      ],
    },
    {
      category: 'Analytics & Reporting',
      features: [
        {
          key: 'reports_dashboards',
          name: 'Analytics & Reports',
          description: 'Dashboard widgets, revenue funnels and BI exports',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'free'
                ? 'Basic Dashboard'
                : 'Advanced Analytics & Reports',
            ]),
          ),
        },
        {
          key: 'activity_timeline',
          name: 'Activity Timeline',
          description: 'Full history of interactions and touches',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'free' ? 'Basic Timeline' : 'Advanced Activity Timeline',
            ]),
          ),
        },
      ],
    },
    {
      category: 'Team & Permissions',
      features: [
        {
          key: 'user_capacity',
          name: 'Team Member Seats',
          description: 'Active user accounts in workspace',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.limits.maxUsers === -1
                ? 'Unlimited'
                : `${p.limits.maxUsers} Users`,
            ]),
          ),
        },
        {
          key: 'rbac_roles',
          name: 'Permissions & Access Control',
          description: 'Granular roles, team scopes, and department isolation',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'free'
                ? 'Basic permissions'
                : p.id === 'starter'
                  ? 'Team Permissions'
                  : p.id === 'growth'
                    ? 'Team Permissions & RBAC'
                    : 'Advanced RBAC & Departments',
            ]),
          ),
        },
        {
          key: 'custom_modules',
          name: 'Custom Modules',
          description: 'Build custom database entities and views',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'business' ||
                p.id === 'enterprise' ||
                checkPlanFeature(p, ['custom modules', 'custom module']),
            ]),
          ),
        },
      ],
    },
    {
      category: 'Governance, API & Security',
      features: [
        {
          key: 'audit_logs',
          name: 'Audit Logs',
          description: 'Tamper-evident activity and security logs',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'business' ||
                p.id === 'enterprise' ||
                checkPlanFeature(p, ['audit log', 'audit trail']),
            ]),
          ),
        },
        {
          key: 'rest_api',
          name: 'API Access & Webhooks',
          description: 'Programmatic REST API access and webhook events',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'business' ||
                p.id === 'enterprise' ||
                checkPlanFeature(p, ['api access', 'webhooks']),
            ]),
          ),
        },
        {
          key: 'cloud_storage',
          name: 'Cloud Storage',
          description: 'Secure document and attachment storage',
          values: Object.fromEntries(
            sortedPlans.map((p) => [p.id, `${p.limits.storageGb || 1} GB`]),
          ),
        },
        {
          key: 'support_level',
          name: 'Support Channel',
          description: 'Support channel and response priority',
          values: Object.fromEntries(
            sortedPlans.map((p) => [
              p.id,
              p.id === 'free' ? 'Community Support' : 'Priority Support',
            ]),
          ),
        },
      ],
    },
  ];
}
