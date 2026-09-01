# CRM Design System Audit — Screen & Pattern Inventory

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Source Files Inspected:** All page routes under [`web/app/`](file:///d:/Projects/project/clixprocrm/web/app/)  

---

## 1. Pattern Classification Matrix

The CRM frontend is structured around **8 distinct screen patterns**:

| Screen Pattern | Primary Purpose | Modules / Screens Using Pattern |
| :--- | :--- | :--- |
| **Pattern A: Data Table with Two-Stage Scroll & Metric Cards** | Primary CRUD & high-density record management | Contacts (`/contacts`), Deals (`/deals`), Companies (`/companies`), Invoices (`/invoices`), Quotations (`/quotations`), Tasks (`/tasks`), Employees (`/employees`) |
| **Pattern B: Executive Dashboard with KPI Grid & Operational Widgets** | At-a-glance performance overview and live widgets | Main CRM Dashboard (`/dashboard`), Super Admin Dashboard (`/super-admin`) |
| **Pattern C: Interactive Kanban / Pipeline Board** | Drag-and-drop workflow stage management | Deals Pipeline (`/deals?view=pipeline`, `/pipeline`), Tasks Board (`/tasks?view=kanban`) |
| **Pattern D: Multi-Tab Hub & In-Depth Configuration** | Module settings, user preferences, security configuration | Settings Hub (`/settings`), Super Admin Settings (`/super-admin/settings`), Role Management (`/role-management`) |
| **Pattern E: Complex Analytics & Multi-Chart Report Hub** | In-depth reporting, charts, breakdown tables, and targets | Reports & Analytics (`/reports`), Super Admin Analytics (`/super-admin/analytics`) |
| **Pattern F: Calendar & Time Grid** | Date/time event scheduling and follow-ups | Calendar (`/calendar`), Attendance (`/attendance`), Tasks Calendar (`/tasks?view=calendar`) |
| **Pattern G: AI Copilot & Interactive Assistant** | Conversational CRM intelligence and context queries | AI Chat (`/ai`), Super Admin Copilot (`/super-admin/copilot`) |
| **Pattern H: Auth Layered Full-Viewport Canvas** | Authentication, registration, password recovery, onboarding | Login (`/login`), Register (`/register`), Forgot Password (`/forgot-password`), Reset Password (`/reset-password`), Onboarding (`/onboarding`) |

---

## 2. Deep Screen-by-Screen Inventory

### 2.1 Pattern A: Data Table with Two-Stage Scroll & Metric Cards

#### 1. Contacts (`/contacts`)
- **File:** [`web/app/(dashboard)/contacts/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/contacts/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `Users`, Badge: `"Unified Contacts"`, Actions: `"Customize"`, `"Bulk Upload"`, `"Add Lead"`).
- **KPI Metrics:** `CRMMetricsGrid cols={3}` (Total Contacts, Active Customers, Active Leads) with 3D gradient `CRMMetricCard` cards.
- **Filter / Search Pattern:** `CRMToolbar` with live search query input + status button pills (`All`, `Leads`, `Customers`, `Inactive`) + View mode toggle (`list`, `grid`).
- **Data Presentation:** `ContactsTable` inside `.crm-table-workspace-sticky` & `.crm-table-wrap`.
- **Empty State:** `EmptyState` with `module="leads"` / `module="customers"` presets, custom action buttons, ambient glow.
- **Loading State:** `ContactsSkeleton` with skeleton KPI cards, toolbar shimmer, and 8-row table skeleton.
- **Modals & Drawers:** `LeadForm` in `FormModal`, `CustomerForm` in `FormModal`, `BulkImportModal`, `ContactContextualSettings` in `ContextualSettingsDrawer`.

#### 2. Deals (`/deals`)
- **File:** [`web/app/(dashboard)/deals/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/deals/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `Handshake`, Badge: `"Sales Operations"`, Actions: `"Customize"`, `"New Deal"`).
- **KPI Metrics:** `CRMMetricsGrid cols={3}` (Total Opportunities, Deals Won / Stuck Deals, Pipeline Value).
- **Filter / Search Pattern:** `CRMToolbar` with search + stage button pills (`All`, `New`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`) or Pipeline filter dropdown (`All Deals`, `Hot Deals`, `Stuck Deals`).
- **Data Presentation:** `DealsTable` (list view), `DealsGrid` (grid view), `PipelineBoard` (pipeline kanban view).
- **Empty State:** `EmptyState module="deals"` with `"Create Deal"` action.
- **Loading State:** `DealsSkeleton` handling both table and kanban board shimmer.
- **Modals & Drawers:** `DealForm` in `FormModal`, `DealContextualSettings` in `ContextualSettingsDrawer`.

#### 3. Companies (`/companies`)
- **File:** [`web/app/(dashboard)/companies/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/companies/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `Building2`, Badge: `"Account Management"`, Actions: `"Customize"`, `"New Company"`).
- **KPI Metrics:** `CRMMetricsGrid cols={3}` (Total Companies, Active Accounts, Total Linked Customers).
- **Filter / Search Pattern:** `CRMToolbar` with search + status pills (`All`, `Active`, `Inactive`).
- **Data Presentation:** `CompaniesTable` / `CompaniesGrid`.
- **Empty State:** `EmptyState module="companies"` with `"Add Company"` action.
- **Loading State:** `CompaniesSkeleton`.
- **Modals & Drawers:** `CompanyForm` in `FormModal`, `CompanyContextualSettings` in `ContextualSettingsDrawer`.

#### 4. Invoices (`/invoices`)
- **File:** [`web/app/(dashboard)/invoices/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `Receipt`, Badge: `"Billing & Revenue"`, Actions: `"Customize"`, `"Create Invoice"`).
- **KPI Metrics:** `CRMMetricsGrid cols={4}` (Total Invoiced, Collected Revenue, Pending Payment, Overdue).
- **Filter / Search Pattern:** `CRMToolbar` with search + status pills (`All`, `Draft`, `Sent`, `Partially Paid`, `Paid`, `Overdue`).
- **Data Presentation:** Sortable Invoices Table with currency formatting, client truncate, status badges.
- **Empty State:** `EmptyState module="invoices"` with `"Create Invoice"` action.
- **Loading State:** `InvoicesSkeleton`.
- **Modals & Drawers:** `CreateInvoiceModal`, `InvoiceDetailModal`, `RecordPaymentModal`, `InvoiceContextualSettings` in `ContextualSettingsDrawer`.

#### 5. Quotations (`/quotations`)
- **File:** [`web/app/(dashboard)/quotations/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/quotations/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `FileText`, Badge: `"Sales Intelligence"`, Actions: `"Customize"`, `"Create Quote"`).
- **KPI Metrics:** `CRMMetricsGrid cols={4}` (Total Quotations, Total Quote Value, Pending Quotes, Approved Quotes).
- **Filter / Search Pattern:** `CRMToolbar` with search + status pills (`All`, `Draft`, `Sent`, `Accepted`, `Rejected`, `Expired`).
- **Data Presentation:** `QuotationsTable` / `QuotationsGrid`.
- **Empty State:** `EmptyState module="quotations"` with `"Create Quote"` action.
- **Loading State:** `QuotationsSkeleton`.
- **Modals & Drawers:** `QuoteForm` in `FormModal`, `QuotationContextualSettings` in `ContextualSettingsDrawer`.

#### 6. Tasks (`/tasks`)
- **File:** [`web/app/(dashboard)/tasks/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/tasks/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `CheckSquare`, Badge: `"Productivity"`, Actions: `"Customize"`, `"New Task"`).
- **KPI Metrics:** `CRMMetricsGrid cols={4}` (Total Tasks, Completed, In Progress, Overdue).
- **Filter / Search Pattern:** `CRMToolbar` with search + 5-mode `ViewToggle` (`list`, `grid`, `kanban`, `calendar`, `timeline`) + status pills (`All`, `Pending`, `In Progress`, `Blocked`, `Completed`, `Overdue`, `Cancelled`).
- **Data Presentation:** `TasksTable`, `TasksGrid`, `KanbanView`, `CalendarView`, `TimelineView`.
- **Empty State:** `EmptyState module="tasks"` with `"Create Task"` action.
- **Loading State:** `TasksSkeleton`.
- **Modals & Drawers:** `CreateTaskModal`, `EditTaskModal`, `TaskDetailsModal`, `MeetingForm` in `FormModal`, `TaskContextualSettings` in `ContextualSettingsDrawer`.

#### 7. Employees (`/employees`)
- **File:** [`web/app/(dashboard)/employees/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `Users`, Badge: `"HR Management"`, Action: `"Add Employee"`).
- **KPI Metrics:** `CRMMetricsGrid cols={4}` (Total Employees, Active Now, Departments, On Leave).
- **Layout Structure:** 3:1 Grid with Table & Pagination on left, `Recent Activity` & `Performance Overview` sidebar on right.
- **Data Presentation:** `DataTable` / `EmployeesGrid` + `CRMPagination`.
- **Empty State:** `EmptyState` with `"Add Employee"` action.
- **Loading State:** `EmployeesSkeleton`.
- **Modals & Drawers:** `EmployeeForm` in `FormModal`, View Details modal, Delete confirmation `AlertDialog`.

---

### 2.2 Pattern B: Executive Dashboard

#### 1. CRM Dashboard (`/dashboard`)
- **File:** [`web/app/(dashboard)/dashboard/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/dashboard/page.tsx)
- **Header Pattern:** `<WelcomeBanner />` with avatar, date, personalized greeting.
- **Action & Timeframe Bar:** Timeframe pills (`today`, `week`, `month`, `year`) + `<DashboardFilterMenu />` + `<CreateNewMenu />`.
- **KPI Row:** `<DashboardKPIs />` with dynamic calculation from real-time CRM queries.
- **Operational Grid:** 3:1 column layout:
  - Left column: `RevenueChartWidget`, `UpcomingMeetingsWidget` & `PendingFollowupsWidget` (2-col), `HotLeadsWidget` & `RecentActivitiesWidget` (2-col), `RecentCustomersWidget`.
  - Right column (sticky): `RevenueTargetWidget`, `AIInsights`, `CalendarWidget`.
- **Empty State:** `<DashboardOnboardingHub />` (complete onboarding checklist when CRM has 0 records).
- **Loading State:** `DashboardSkeleton` with individual widget skeleton wrappers (`DashboardWidgetSkeleton`).

#### 2. Super Admin Dashboard (`/super-admin`)
- **File:** [`web/app/(super-admin)/super-admin/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(super-admin)/super-admin/page.tsx)
- **Header Pattern:** `SuperAdminHeader` with platform status badge, global search, quick tenant switcher.
- **KPI Metrics:** Platform MRR, Active Tenants, Total Platform Users, System Health score.
- **Operational Layout:** Tenant list table, revenue breakdown charts, real-time security alert ticker, API consumption graph.

---

### 2.3 Pattern D: Settings & Configuration Hub

#### 1. Settings Page (`/settings`)
- **File:** [`web/app/(dashboard)/settings/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/settings/page.tsx)
- **Navigation Architecture:** URL query parameter driven (`?section=profile`, `?section=notifications`, `?section=general`, `?section=billing`, `?section=integrations`, `?section=security-privacy`, `?section=sessions`, `?section=audit-log`).
- **Header Pattern:** `<SettingsHeader />` dynamic title & description based on active section.
- **Layout:** Full-width container with independent vertical smooth scroll (`sidebar-scroll`) and section transition animations.
- **Contextual In-Module Settings:** Standalone module customization (e.g. lead sources, invoice numbering, pipeline stages) migrated into `<ContextualSettingsDrawer />` on individual module pages with backward-compatible URL redirects.

---

### 2.4 Pattern E: Analytics & Reports Hub

#### 1. Reports & Analytics (`/reports`)
- **File:** [`web/app/(dashboard)/reports/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/reports/page.tsx)
- **Page Header:** `CRMPageHeader` (Icon: `BarChart3`, Actions: `"Targets"`, `"Refresh"`, `"This Month"`, `"Export"`).
- **KPI Metrics:** `CRMMetricsGrid cols={4}` with revenue, conversion rate, closed deals, forecast.
- **Layout Structure:**
  - Row 1: `AnalyticsSummary` (AI executive bullet points).
  - Row 2: 2:1 Grid with `RevenueChart`, `ConversionChart`, `SalesFunnel` on left; `RevenueTarget`, `LeadSourceChart`, `SalesActivities` on right.
  - Row 3: 4-Column Grid with `TopCustomers`, `RecentActivities`, `UpcomingFollowUps`, `AIInsights`.
  - Row 4: `PerformanceTable` (Sales rep quota & conversion leaderboard).
- **Drawer:** `<Sheet>` slide-over drawer embedding `<RevenueTargetSettings />`.

---

### 2.5 Pattern H: Auth Layered Full-Viewport Canvas

#### 1. Login (`/login`), Register (`/register`), Forgot Password (`/forgot-password`), Onboarding (`/onboarding`)
- **Files:** [`web/features/auth/components/auth-layout.tsx`](file:///d:/Projects/project/clixprocrm/web/features/auth/components/auth-layout.tsx), [`web/app/(auth)/login/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(auth)/login/page.tsx)
- **Layer 1:** Ambient background canvas with animated floating gradient blobs (`.auth-bg-layer`, `.auth-blob-1`, `.auth-blob-2`).
- **Layer 2 (Left):** Brand emblem, headline with emerald gradient accent (`.auth-headline-accent`), feature list items with frosted icon pills, social proof pill.
- **Layer 3 (Right):** Floating card (`.auth-card` with shimmer bar, border, title, form controls, social OAuth, submit button, footer links).
