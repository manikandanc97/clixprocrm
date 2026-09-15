export interface FeatureCatalogItem {
  key: string;
  name: string;
  category: string;
  description: string;
}

export const FEATURE_CATALOG: FeatureCatalogItem[] = [
  // Core CRM
  {
    key: 'lead_management',
    name: 'Lead Management',
    category: 'Core CRM',
    description: 'Capture, qualify, and track sales leads',
  },
  {
    key: 'contact_management',
    name: 'Contact Management',
    category: 'Core CRM',
    description: 'Centralized customer and contact profiles',
  },
  {
    key: 'deal_pipeline',
    name: 'Deal Pipeline',
    category: 'Core CRM',
    description: 'Visual pipeline stages and opportunity tracking',
  },
  {
    key: 'quotations',
    name: 'Quotations & Proposals',
    category: 'Core CRM',
    description: 'Create and send branded sales quotations',
  },
  {
    key: 'invoicing',
    name: 'Invoicing & Payments',
    category: 'Core CRM',
    description: 'Generate invoices and record revenue',
  },

  // Collaboration & Tasks
  {
    key: 'tasks',
    name: 'Tasks & Reminders',
    category: 'Collaboration',
    description: 'Task assignments, checklists, and calendar deadlines',
  },
  {
    key: 'meetings',
    name: 'Meetings & Scheduling',
    category: 'Collaboration',
    description: 'Schedule client meetings and video calls',
  },
  {
    key: 'document_management',
    name: 'Document Management',
    category: 'Collaboration',
    description: 'Secure attachment storage and workspace documents',
  },

  // Communication & Automation
  {
    key: 'email_integration',
    name: 'Email Integration',
    category: 'Automation & Comms',
    description: 'Direct email communication and logging',
  },
  {
    key: 'whatsapp_integration',
    name: 'WhatsApp Integration',
    category: 'Automation & Comms',
    description: 'Instant messaging and customer chat',
  },
  {
    key: 'automation',
    name: 'Automation Workflows',
    category: 'Automation & Comms',
    description: 'Automated stage triggers and reminder notifications',
  },

  // Insights & Roles
  {
    key: 'reports',
    name: 'Standard Reports',
    category: 'Insights & Roles',
    description: 'Exportable CRM activity and sales reports',
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    category: 'Insights & Roles',
    description: 'Conversion funnels, revenue trends, and performance metrics',
  },
  {
    key: 'custom_roles',
    name: 'Custom Roles & Permissions',
    category: 'Insights & Roles',
    description: 'Granular RBAC role definitions and data scoping',
  },

  // AI & Copilot
  {
    key: 'ai_assistant',
    name: 'AI Copilot & Assistant',
    category: 'AI & Intelligence',
    description: 'Smart assistant for summarization and CRM actions',
  },
  {
    key: 'document_rag',
    name: 'Document RAG & Embeddings',
    category: 'AI & Intelligence',
    description: 'Semantic retrieval across customer documents',
  },
  {
    key: 'lead_scoring',
    name: 'AI Lead Scoring',
    category: 'AI & Intelligence',
    description: 'Predictive lead scoring and opportunity prioritization',
  },

  // Enterprise & Security
  {
    key: 'api_access',
    name: 'REST API & Webhooks',
    category: 'Enterprise & Security',
    description: 'Programmatic API access and webhook subscriptions',
  },
  {
    key: 'audit_logs',
    name: 'Audit Logs & Immutability',
    category: 'Enterprise & Security',
    description: 'Cryptographic hash-chained audit trails',
  },
  {
    key: 'advanced_security',
    name: 'Advanced Security & SSO',
    category: 'Enterprise & Security',
    description: 'Enforced MFA, session management, and enterprise security',
  },
  {
    key: 'enterprise_support',
    name: 'Enterprise Priority Support',
    category: 'Enterprise & Security',
    description: 'Dedicated account manager and 24/7 SLA',
  },
];
