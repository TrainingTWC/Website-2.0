const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// normalize CRLF to LF on read, write with LF
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}
function write(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
}
function rep(src, from, to) {
  const f = from.replace(/\r\n/g, '\n');
  if (!src.includes(f)) throw new Error('ANCHOR NOT FOUND:\n' + f.slice(0, 120));
  return src.replace(f, to);
}

// ── 1. convex/schema.ts ───────────────────────────────────────
{
  let s = read('convex/schema.ts');
  s = rep(s,
    `    role: v.union(\n      v.literal("superadmin"),\n      v.literal("admin"),\n      v.literal("editor"),\n      v.literal("viewer")\n    ),\n    permissions: v.object({`,
    `    role: v.union(\n      v.literal("superadmin"),\n      v.literal("admin"),\n      v.literal("editor"),\n      v.literal("viewer"),\n      v.literal("hr"),\n      v.literal("marketing"),\n      v.literal("pr")\n    ),\n    permissions: v.object({`
  );
  write('convex/schema.ts', s);
  console.log('✓ schema.ts');
}

// ── 2. convex/admins.ts ──────────────────────────────────────
{
  let s = read('convex/admins.ts');

  // a) insert CMS_ONLY_PERMS constant before permsForRole
  s = rep(s,
    `function permsForRole(role: "superadmin" | "admin" | "editor" | "viewer") {`,
    `const CMS_ONLY_PERMS = {\n  overview: false,\n  inventory: false,\n  orders: false,\n  analytics: false,\n  editorial: false,\n  home: true,\n  rules: false,\n  customers: false,\n  settings: false,\n};\n\nfunction permsForRole(role: "superadmin" | "admin" | "editor" | "viewer" | "hr" | "marketing" | "pr") {`
  );

  // b) add hr/marketing/pr branch
  s = rep(s,
    `  if (role === "superadmin") return FULL_PERMS;\n  if (role === "admin") return DEFAULT_ADMIN_PERMS;\n  if (role === "editor") return EDITOR_PERMS;\n  return VIEWER_PERMS;`,
    `  if (role === "superadmin") return FULL_PERMS;\n  if (role === "admin") return DEFAULT_ADMIN_PERMS;\n  if (role === "editor") return EDITOR_PERMS;\n  if (role === "hr" || role === "marketing" || role === "pr") return CMS_ONLY_PERMS;\n  return VIEWER_PERMS;`
  );

  // c) invite mutation role union
  s = rep(s,
    `    role: v.union(\n      v.literal("admin"),\n      v.literal("editor"),\n      v.literal("viewer")\n    ),`,
    `    role: v.union(\n      v.literal("admin"),\n      v.literal("editor"),\n      v.literal("viewer"),\n      v.literal("hr"),\n      v.literal("marketing"),\n      v.literal("pr")\n    ),`
  );

  // d) update mutation role union (inside optional)
  s = rep(s,
    `      v.union(\n        v.literal("superadmin"),\n        v.literal("admin"),\n        v.literal("editor"),\n        v.literal("viewer")\n      )`,
    `      v.union(\n        v.literal("superadmin"),\n        v.literal("admin"),\n        v.literal("editor"),\n        v.literal("viewer"),\n        v.literal("hr"),\n        v.literal("marketing"),\n        v.literal("pr")\n      )`
  );

  write('convex/admins.ts', s);
  console.log('✓ admins.ts');
}

// ── 3. AdminAuthGate.tsx ─────────────────────────────────────
{
  let s = read('src/components/admin/AdminAuthGate.tsx');
  s = rep(s,
    `    role: "superadmin" | "admin" | "editor" | "viewer";`,
    `    role: "superadmin" | "admin" | "editor" | "viewer" | "hr" | "marketing" | "pr";`
  );
  write('src/components/admin/AdminAuthGate.tsx', s);
  console.log('✓ AdminAuthGate.tsx');
}

// ── 4. SuperAdminDashboard.tsx ───────────────────────────────
{
  let s = read('src/components/admin/SuperAdminDashboard.tsx');

  s = rep(s,
    `type Role = "superadmin" | "admin" | "editor" | "viewer";`,
    `type Role = "superadmin" | "admin" | "editor" | "viewer" | "hr" | "marketing" | "pr";`
  );

  s = rep(s,
    `  viewer: { label: "Viewer", icon: Eye, tone: "bg-stone-100 text-stone-700 border-stone-200" },\n};`,
    `  viewer:    { label: "Viewer",    icon: Eye,       tone: "bg-stone-100 text-stone-700 border-stone-200"    },\n  hr:        { label: "HR",         icon: Users,     tone: "bg-violet-100 text-violet-700 border-violet-200" },\n  marketing: { label: "Marketing",  icon: Globe,     tone: "bg-orange-100 text-orange-700 border-orange-200" },\n  pr:        { label: "PR",         icon: Newspaper, tone: "bg-teal-100 text-teal-700 border-teal-200"       },\n};`
  );

  s = rep(s,
    `  const [role, setRole] = useState<"admin" | "editor" | "viewer">("admin");`,
    `  const [role, setRole] = useState<"admin" | "editor" | "viewer" | "hr" | "marketing" | "pr">("admin");`
  );

  s = rep(s,
    `              {(["admin", "editor", "viewer"] as const).map((r) => {`,
    `              {(["admin", "editor", "viewer", "hr", "marketing", "pr"] as const).map((r) => {`
  );

  s = rep(s,
    `                  {(["admin", "editor", "viewer"] as Role[]).map((r) => (`,
    `                  {(["admin", "editor", "viewer", "hr", "marketing", "pr"] as Role[]).map((r) => (`
  );

  write('src/components/admin/SuperAdminDashboard.tsx', s);
  console.log('✓ SuperAdminDashboard.tsx');
}

// ── 5. UnifiedCMS.tsx ────────────────────────────────────────
{
  let s = read('src/components/admin/UnifiedCMS.tsx');

  s = rep(s,
    `import { useState } from "react";`,
    `import { useState } from "react";\nimport { useQuery } from "convex/react";\nimport { api } from "../../../convex/_generated/api";\n\nconst convexApi = api as any;`
  );

  s = rep(s,
    `export function UnifiedCMS() {\n  const [active, setActive] = useState<TabId>("home");\n  const activeDef = TABS.find((t) => t.id === active)!;`,
    `const ROLE_TAB_ALLOW: Partial<Record<string, TabId[]>> = {\n  hr:        ["careers"],\n  marketing: ["home", "third-circle", "story", "coffee"],\n  pr:        ["newsroom"],\n};\n\nexport function UnifiedCMS() {\n  const me = useQuery(convexApi.admins.me) as any;\n  const role: string = me?.admin?.role ?? "admin";\n  const allowedIds = ROLE_TAB_ALLOW[role];\n  const visibleTabs = allowedIds ? TABS.filter((t) => allowedIds.includes(t.id)) : TABS;\n\n  const [active, setActive] = useState<TabId>("home");\n  const effectiveActive: TabId = visibleTabs.some((t) => t.id === active)\n    ? active\n    : (visibleTabs[0]?.id ?? "home");\n  const activeDef = visibleTabs.find((t) => t.id === effectiveActive) ?? TABS[0];`
  );

  s = rep(s,
    `          {TABS.map((t) => {\n            const on = active === t.id;`,
    `          {visibleTabs.map((t) => {\n            const on = effectiveActive === t.id;`
  );

  s = rep(s,
    `                onClick={() => setActive(t.id)}`,
    `                onClick={() => setActive(t.id as TabId)}`
  );

  s = rep(s,
    `        {active === "home" && <HomeContentCMS />}\n        {active === "third-circle" && <EditorialCMS />}\n        {active === "story" && <AboutCMS page="story" />}\n        {active === "coffee" && <AboutCMS page="coffee" />}\n        {active === "careers" && <AboutCMS page="careers" />}\n        {active === "newsroom" && <AboutCMS page="newsroom" />}`,
    `        {effectiveActive === "home" && <HomeContentCMS />}\n        {effectiveActive === "third-circle" && <EditorialCMS />}\n        {effectiveActive === "story" && <AboutCMS page="story" />}\n        {effectiveActive === "coffee" && <AboutCMS page="coffee" />}\n        {effectiveActive === "careers" && <AboutCMS page="careers" />}\n        {effectiveActive === "newsroom" && <AboutCMS page="newsroom" />}`
  );

  write('src/components/admin/UnifiedCMS.tsx', s);
  console.log('✓ UnifiedCMS.tsx');
}

// ── 6. AdminDashboard.tsx ────────────────────────────────────
{
  let s = read('src/components/admin/AdminDashboard.tsx');

  s = rep(s,
    `export function AdminDashboard({ me }: { me?: AdminMe }) {\n  const [activeTab, setActiveTab] = useState<\n    "overview" | "inventory" | "analytics" | "rules" | "orders" | "editorial" | "home" | "about" | "settings"\n  >("overview");`,
    `export function AdminDashboard({ me }: { me?: AdminMe }) {\n  const isCmsOnly = me?.admin?.role === "hr" || me?.admin?.role === "marketing" || me?.admin?.role === "pr";\n  const [activeTab, setActiveTab] = useState<\n    "overview" | "inventory" | "analytics" | "rules" | "orders" | "editorial" | "home" | "about" | "settings"\n  >(isCmsOnly ? "home" : "overview");`
  );

  s = rep(s,
    `  const navGroups: NavGroup[] = [\n    {\n      label: "Workspace",\n      items: [\n        { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },\n        { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },\n        { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },\n      ],\n    },\n    {\n      label: "Catalog",\n      items: [\n        { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },\n        { id: "home", label: "CMS", icon: <Globe className="w-4 h-4" /> },\n      ],\n    },\n    {\n      label: "System",\n      items: [\n        { id: "rules", label: "Logic Rules", icon: <Search className="w-4 h-4" /> },\n        { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },\n      ],\n    },\n  ];`,
    `  const navGroups: NavGroup[] = isCmsOnly\n    ? [{ label: "Content", items: [{ id: "home", label: "CMS", icon: <Globe className="w-4 h-4" /> }] }]\n    : [\n        {\n          label: "Workspace",\n          items: [\n            { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },\n            { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },\n            { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },\n          ],\n        },\n        {\n          label: "Catalog",\n          items: [\n            { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },\n            { id: "home", label: "CMS", icon: <Globe className="w-4 h-4" /> },\n          ],\n        },\n        {\n          label: "System",\n          items: [\n            { id: "rules", label: "Logic Rules", icon: <Search className="w-4 h-4" /> },\n            { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },\n          ],\n        },\n      ];`
  );

  s = rep(s,
    `        role: me?.admin?.role === "superadmin" ? "Superadmin" : "Admin",`,
    `        role: ({ superadmin: "Superadmin", admin: "Admin", editor: "Editor", viewer: "Viewer", hr: "HR", marketing: "Marketing", pr: "PR" } as Record<string, string>)[me?.admin?.role ?? "admin"] ?? "Admin",`
  );

  write('src/components/admin/AdminDashboard.tsx', s);
  console.log('✓ AdminDashboard.tsx');
}

console.log('\n✅ All CMS role patches applied.');
