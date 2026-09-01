const fs = require("fs");
const path = require("path");

const data = require("./audit-shadows-output.json");

// Classification rules
const categories = {
  BADGES: [],
  INPUTS_CONTROLS: [],
  BUTTONS: [],
  TABLES: [],
  COLORED_CARDS_KPIS: [],
  WHITE_CARDS: [],
  DROPDOWNS_POPOVERS: [],
  MODALS_DIALOGS: [],
  AVATARS_ICONS: [],
  OTHER: []
};

data.forEach(item => {
  const t = item.text.toLowerCase();
  const f = item.file.toLowerCase();

  if (f.includes("badge") || t.includes("badge") || t.includes("rolebadge") || t.includes("planbadge") || t.includes("statusbadge") || t.includes("rounded-full px-") || t.includes("rounded-full text-") || t.includes("pill")) {
    categories.BADGES.push(item);
  } else if (f.includes("input") || t.includes("<input") || t.includes("input ") || t.includes("crm-control") || t.includes("searchquery") || t.includes("placeholder=")) {
    categories.INPUTS_CONTROLS.push(item);
  } else if (f.includes("button") || t.includes("<button") || t.includes("buttonvariants") || t.includes("btn")) {
    categories.BUTTONS.push(item);
  } else if (f.includes("table") || t.includes("table") || t.includes("crm-table")) {
    categories.TABLES.push(item);
  } else if (f.includes("metric") || f.includes("kpi") || t.includes("metric") || t.includes("gradient-to-") || t.includes("bg-emerald-") || t.includes("bg-blue-") || t.includes("bg-indigo-") || t.includes("bg-amber-") || t.includes("bg-purple-") || t.includes("bg-rose-")) {
    categories.COLORED_CARDS_KPIS.push(item);
  } else if (f.includes("dialog") || f.includes("modal") || f.includes("sheet") || f.includes("drawer") || t.includes("dialogcontent") || t.includes("modal")) {
    categories.MODALS_DIALOGS.push(item);
  } else if (f.includes("popover") || f.includes("dropdown") || f.includes("select") || t.includes("dropdownmenucontent") || t.includes("popovercontent") || t.includes("selectcontent")) {
    categories.DROPDOWNS_POPOVERS.push(item);
  } else if (f.includes("avatar") || t.includes("avatar") || t.includes("icon-box") || t.includes("crm-icon-box")) {
    categories.AVATARS_ICONS.push(item);
  } else if (f.includes("card") || t.includes("card") || t.includes("crm-card")) {
    categories.WHITE_CARDS.push(item);
  } else {
    categories.OTHER.push(item);
  }
});

for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n=== Category: ${cat} (${items.length} items) ===`);
  items.slice(0, 8).forEach(i => console.log(`  [${i.file}:${i.line}] ${i.text}`));
}
