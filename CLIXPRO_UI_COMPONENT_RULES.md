# ClixProCRM UI Component Rules

## Purpose

ClixProCRM follows a **shadcn/ui-first component architecture**.

The goal is to maintain:

- Consistent UI
- Consistent UX
- Reusable components
- Minimal duplication
- Predictable component APIs
- Easy long-term maintenance

---

# 1. Component Priority

Whenever implementing or modifying UI, follow this priority order:

### Priority 1 — Existing ClixProCRM Canonical Component

If an existing canonical ClixProCRM component already solves the requirement, reuse it.

Do not create another component for the same purpose.

---

### Priority 2 — Official shadcn/ui Component

If no existing ClixProCRM canonical component exists, use the appropriate shadcn/ui component.

Do not create a custom replacement for functionality already provided by shadcn/ui.

---

### Priority 3 — New Custom Component

Create a custom component ONLY when:

1. No suitable existing ClixProCRM component exists, AND
2. No suitable shadcn/ui component exists, OR
3. The component represents genuine ClixProCRM business/domain functionality.

Custom components should use shadcn/ui primitives internally whenever possible.

---

# 2. Approved shadcn/ui Components

The following shadcn/ui components are approved for use in ClixProCRM:

- Accordion
- Alert
- Alert Dialog
- Aspect Ratio
- Attachment
- Avatar
- Badge
- Breadcrumb
- Bubble
- Button
- Button Group
- Calendar
- Carousel
- Chart
- Checkbox
- Collapsible
- Combobox
- Command
- Context Menu
- Data Table
- Date Picker
- Dialog
- Direction
- Drawer
- Dropdown Menu
- Empty
- Field
- Hover Card
- Input
- Input Group
- Input OTP
- Item
- Kbd
- Label
- Marker
- Menubar
- Message
- Message Scroller
- Native Select
- Navigation Menu
- Pagination
- Popover
- Progress
- Questionnaire
- Radio Group
- Resizable
- Scroll Area
- Select
- Separator
- Sheet
- Sidebar
- Skeleton
- Slider
- Spinner
- Switch
- Table
- Tabs
- Textarea
- Toast
- Toggle
- Toggle Group
- Tooltip
- Typography

---

# 3. Never Duplicate shadcn/ui Primitives

Do NOT create custom components when shadcn/ui already provides the required primitive.

Examples of prohibited unnecessary duplicates:

- CustomButton
- PrimaryButton
- AppButton
- CRMButton

when the requirement can be handled by `Button`.

Do NOT create:

- CustomModal
- CRMModal
- ConfirmModal

when `Dialog` or `AlertDialog` is sufficient.

Do NOT create:

- CustomDropdown
- ActionDropdown

when `DropdownMenu` is sufficient.

Do NOT create:

- CustomSelect

when `Select`, `Native Select`, or `Combobox` is sufficient.

Do NOT create:

- CustomTable

when `Table` or `Data Table` is sufficient.

Do NOT create:

- CustomTabs

when `Tabs` is sufficient.

Do NOT create:

- CustomTooltip

when `Tooltip` is sufficient.

Do NOT create:

- CustomDrawer

when `Drawer` is sufficient.

Do NOT create:

- CustomSheet

when `Sheet` is sufficient.

---

# 4. Custom Components Are Allowed

Custom components are allowed when they represent reusable CRM-specific patterns or business functionality.

Examples:

- CRMDeleteDialog
- CRMPageHeader
- CRMDataTable
- CRMForm
- CRMEmptyState
- CRMTableSkeleton
- LeadScoreCard
- SalesPipeline
- CustomerHealth
- RevenueWidget
- EmployeePerformance
- BulkImportWizard

However, these components should use shadcn/ui primitives internally whenever applicable.

Example:

`CRMDeleteDialog` should use `AlertDialog` internally.

---

# 5. Component Architecture

ClixProCRM should follow this hierarchy:

```text
shadcn/ui primitives
        ↓
ClixProCRM canonical components
        ↓
CRM domain/business components
        ↓
Module pages
```
