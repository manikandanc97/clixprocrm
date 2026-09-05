const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Read list of initial modules from trace
const traceScript = require('./trace-dashboard-deps.js');

// Let's inspect initial files for framer-motion usage
const motionFiles = [
  'features/auth/components/auth-loading-screen.tsx',
  'shared/components/icons/icon-registry.tsx',
  'shared/components/sidebar/BaseSidebar.tsx',
  'shared/lib/motion.ts',
  'features/dashboard/components/NotificationPanel.tsx',
  'shared/components/EmptyState.tsx',
  'features/dashboard/components/SidebarContext.tsx',
  'shared/components/crm/CRMCard.tsx',
  'features/dashboard/components/DashboardOnboardingHub.tsx',
  'features/dashboard/components/DashboardWidgetWrapper.tsx',
  'features/dashboard/components/WelcomeBanner.tsx',
  'features/dashboard/components/DashboardKPIs.tsx',
  'features/dashboard/components/DashboardFilterMenu.tsx',
  'features/dashboard/components/CreateNewMenu.tsx',
  'features/dashboard/components/DashboardShell.tsx',
  'features/dashboard/components/sidebar.tsx',
  'shared/ui/alert-dialog.tsx'
];

let totalMotionTags = 0;
let totalAnimatePresence = 0;
let totalWhileHover = 0;
let totalWhileTap = 0;
let totalLayout = 0;

console.log("=== FRAMER MOTION USAGE IN INITIAL DASHBOARD FILES ===");
for (const rel of motionFiles) {
  const fp = path.join(rootDir, rel);
  if (!fs.existsSync(fp)) continue;
  const content = fs.readFileSync(fp, 'utf8');
  if (!content.includes('framer-motion')) continue;

  const motionTags = (content.match(/<motion\.[a-z0-9]+/g) || []).length;
  const ap = (content.match(/<AnimatePresence/g) || []).length;
  const wh = (content.match(/whileHover/g) || []).length;
  const wt = (content.match(/whileTap/g) || []).length;
  const lyt = (content.match(/layout\b|layoutId/g) || []).length;

  totalMotionTags += motionTags;
  totalAnimatePresence += ap;
  totalWhileHover += wh;
  totalWhileTap += wt;
  totalLayout += lyt;

  console.log(`\n📄 ${rel}:`);
  console.log(`   motion elements: ${motionTags}, AnimatePresence: ${ap}, whileHover: ${wh}, whileTap: ${wt}, layout: ${lyt}`);
}

console.log("\n=== TOTALS ACROSS DASHBOARD SHELL ===");
console.log(`Total <motion.*>: ${totalMotionTags}`);
console.log(`Total <AnimatePresence>: ${totalAnimatePresence}`);
console.log(`Total whileHover: ${totalWhileHover}`);
console.log(`Total whileTap: ${totalWhileTap}`);
console.log(`Total layout: ${totalLayout}`);
